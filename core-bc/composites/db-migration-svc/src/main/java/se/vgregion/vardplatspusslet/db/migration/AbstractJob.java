package se.vgregion.vardplatspusslet.db.migration;

import se.vgregion.vardplatspusslet.db.migration.sql.*;
import se.vgregion.vardplatspusslet.db.migration.sql.meta.Column;
import se.vgregion.vardplatspusslet.db.migration.sql.meta.Schema;
import se.vgregion.vardplatspusslet.db.migration.sql.meta.Table;
import se.vgregion.vardplatspusslet.db.migration.util.Filez;
import se.vgregion.vardplatspusslet.db.migration.util.Zerial;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Created by clalu4 on 2017-03-22.
 */
public abstract class AbstractJob {

    protected ConnectionExt legacyCon;
    protected ConnectionExt mainCon;

    /*private static Properties getLegacyProperties() {
        Path path = (Paths.get(System.getProperty("user.home"), ".app", "vardplatspusslet", "legacy.jdbc.properties"));
        return getProperties(path);
    }*/

    private static Properties getMainJdbcProperties() {
        Path path = (Paths.get(System.getProperty("user.home"), ".app", "vardplatspusslet", "application.properties"));
        return getProperties(path);
    }

    private static Properties getProperties(Path fromHere) {
        Properties properties = new Properties();
        try (BufferedReader reader = Files.newBufferedReader(fromHere)) {
            properties.load(reader);
        } catch (IOException ioe) {
            throw new RuntimeException(ioe);
        }
        return properties;
    }

    /*public static ConnectionExt getLegacyConnectionExt() {
        Properties prop = getLegacyProperties();
        ConnectionExt connection = new ConnectionExt(
            prop.getProperty("url"),
            prop.getProperty("user"),
            prop.getProperty("password"),
            prop.getProperty("driver"));
        return connection;
    }*/

    public static ConnectionExt getMainConnectionExt() {
        Properties prop = getMainJdbcProperties();
        ConnectionExt connection = new ConnectionExt(
            prop.getProperty("jdbc.url"),
            prop.getProperty("jdbc.user"),
            prop.getProperty("jdbc.password"),
            prop.getProperty("jdbc.driver"));
        return connection;
    }

    public void init() {
        legacyCon = getLegacyConnectionExt();
        mainCon = getMainConnectionExt();
    }

    public void copyTypesFromLegacyToDiscCache() {
        for (Table table : legacyCon.getSchemas("dbo").get(0).getTables()) {
            Path path = Paths.get(getTypesCacheDirectory().toString(), table.getTableName() + ".json");
            Zerial.toJsonFile(table, path);
        }
    }

    public void dropTablesAlreadyInMain() {
        ConnectionExt local = getMainConnectionExt();
        for (Table table : getTablesOnDisc()) {
            local.execute("drop table if exists " + table.getTableName() + " cascade");
            local.commit();
            System.out.println("Droped " + table.getTableName());
        }
    }

    public void dropOtherJpaTables() {
        ConnectionExt local = getMainConnectionExt();
        local.execute("drop table if exists " + "archived_data" + " cascade");
        local.execute("drop table if exists " + "ao3_prodn1" + " cascade");
        local.commit();
        System.out.println("Droped " + "archived_data and ao3_prodn1");
    }

    public void createTablesInMainDatabase() {
        mainCon.getSchemas("public");
        for (Table table : getTablesOnDisc()) {
            String ddl = toDdl(table);
            try {
                mainCon.execute(ddl);
            } catch (Exception e) {
                System.out.println("Failed " + ddl);
                throw new RuntimeException(e);
            }
        }
        mainCon.commit();
    }

    public void main() {
        ConnectionExt connection = getMainConnectionExt();
        long timeBefore = System.currentTimeMillis();
        for (Schema schema : connection.getSchemas("dbo")) {
            Path path = Paths.get(getTypesCacheDirectory().toString(), schema.getName() + ".java.obj");
            Zerial.toFile(schema, path);
        }
        System.out.println("Time for getting the schema where " + Math.round(System.currentTimeMillis() - timeBefore) / 1000);
    }


    public void copyDataToDiscCache() {
        //SchemaInf dbo = legacyCon.getSchemas("dbo").get(0);
        for (Table table : getTablesOnDisc()) {
            System.out.println("Fetching data from " + table.getTableName());
            List<Map<String, Object>> tupels = legacyCon.query("select * from dbo." + table.getTableName(), 0, 10_000_000);
            Path path = Paths.get(getDataCacheDirectory().toString(), table.getTableName() + ".tuple.json");
            Zerial.toJsonFile(tupels, path);
        }
    }

    public List<Table> getTablesOnDisc() {
        List<Table> result = new ArrayList<>();
        Path path = getTypesCacheDirectory();
        File[] schemaFiles = path.toFile().listFiles();
        for (File schemaFile : schemaFiles) {
            result.add(Zerial.fromJsonFile(Table.class, schemaFile.toPath()));
        }
        return result;
    }


    public void copyDataIntoMainDatabase() {
        Map<String, Object> itemWithBetterKeys = null;
        for (Table table : getTablesOnDisc()) {
            if (table.getTableName().equals("viewAPKwithAO3")) {
                System.out.println("viewAPKwithAO3");
            }
            Map<String, Object> lastItem = null;
            try {
                System.out.println("Inserts data into " + table.getTableName());
                Path path = Paths.get(getDataCacheDirectory().toString(), table.getTableName() + ".tuple.json");
                List<Map<String, Object>> items = Zerial.fromJsonFile(List.class, path);
                int index = -1;
                for (Map<String, Object> item : items) {
                    lastItem = item;
                    if (table.getPrimaries().isEmpty()) {
                        if (!item.containsKey("id") && !item.containsKey("ID") && !item.containsKey("Id")) {
                            item.put("id", index--);
                        }
                    }
                    itemWithBetterKeys = new HashMap<>();
                    for (Map.Entry<String, Object> entry : item.entrySet()) {
                        itemWithBetterKeys.put(toImprovedColumnName(entry.getKey()), entry.getValue());
                    }
                    for (Column column : table.getColumns()) {
                        if (column.getColumnClassName().equals(Timestamp.class.getName())) {
                            Long l = (Long) itemWithBetterKeys.get(column.getColumnName());
                            if (l != null) {
                                Timestamp ts = new Timestamp(l);
                                itemWithBetterKeys.put(column.getColumnName(), ts);
                            }
                        }
                    }
                    itemWithBetterKeys.remove("SSMA_TimeStamp");
                    itemWithBetterKeys.remove("Expr2"); // in table viewAPKwithAO3
                    mainCon.insert(table.getTableName(), itemWithBetterKeys);
                }
                mainCon.commit();
            } catch (Exception e) {
                System.out.println("Failed insert into " + table + " the data was " + itemWithBetterKeys);
                Path to = Paths.get(getDatabaseCacheDirectory(), "item.failed.on.insert.map");
                Zerial.toJsonFile(itemWithBetterKeys, to);
                throw new RuntimeException(e);
            }
        }
    }

    public void findTableAndColumnNamesInsideFiles() {
        Path path = (Paths.get(System.getProperty("user.home"), ".app", "vardplatspusslet", "legacy.jdbc.properties"));
        Properties properties = getProperties(path);
        if (properties.containsKey("old.code")) {
            findTableAndColumnNamesInsideFiles(Paths.get(properties.getProperty("old.code")));
        } else {
            System.out.println("The file " + path + " does not contain the 'old.code' property. Skips this.");
        }
    }

    public void findTableAndColumnNamesInsideFiles(Path dirOfTheFiles) {
        Path root = dirOfTheFiles;
        //System.out.println(Filez.findDistinctWords(root, "AgarformID"));
        StringBuilder sb = new StringBuilder("Typ;Nyckelord;Förekomster\n");
        for (Table table : getTablesOnDisc()) {
            sb.append("Tabell;" + table.getTableName() + ";" + Filez.findDistinctWords(root, table.getTableName()).size() + "\n");
            for (Column column : table.getColumns()) {
                sb.append("Column;" + column.getColumnName() + ";" + Filez.findDistinctWords(root, column.getColumnName()).size() + "\n");
                Filez.findDistinctWords(root, column.getColumnName());
            }
            sb.append("---;---;---\n");
        }
        System.out.println(sb);
    }

    private static String toImprovedColumnName(String column) {
        return column
            .replaceAll("[Å]", "A")
            .replaceAll("[Ä]", "A")
            .replaceAll("[Ö]", "O")
            .replaceAll("[å]", "a")
            .replaceAll("[ä]", "a")
            .replaceAll("[ö]", "o");
    }

    public String toDdl(Table table) {
        StringBuilder sb = new StringBuilder("create table " + table.getTableName());

        Junctor<Atom> types = new Junctor("(", ", ", ")");

        Properties translations = getTypeTranslations();

        Set<String> textFormatsWithNoParm = new HashSet<>(Arrays.asList("text"));


        for (Column column : table.getColumns()) {
            if (column.getColumnName().equals("SSMA_TimeStamp")) {
                continue;
            }
            String originalType = column.getColumnTypeName();
            if (originalType.endsWith(" identity")) {
                originalType = originalType.replace(" identity", "");
            }
            String type = translations.getProperty(originalType, originalType);

            if (!textFormatsWithNoParm.contains(type)) {
                if (column.getColumnClassName().equals(String.class.getName())) {
                    type += "(" + column.getColumnDisplaySize() + ")";
                }
            }

            String improvedColumnName = toImprovedColumnName(column.getColumnName());

            if (column.isNullable()) {
                types.add(new Atom<>(improvedColumnName + " " + type));
            } else {
                types.add(new Atom<>(improvedColumnName + " " + type + " not null"));
            }
        }

        // CONSTRAINT user_pkey PRIMARY KEY (id)

        if (!table.getPrimaries().isEmpty()) {
            Junctor<Atom> pks = new Junctor<>("(", ", ", ")");
            table.getPrimaries().forEach(pk -> {
                pks.add(new Atom(pk.getColumnName()));
            });
            StringBuilder pkSb = new StringBuilder();
            pks.toSql(pkSb, new ArrayList());
            types.add(new Atom("constraint " + table.getTableName() + "_pk primary key" + pkSb));
        } else {
            if (table.getColumn("id") == null && table.getColumn("ID") == null && table.getColumn("Id") == null) {
                types.add(new Atom("id bigint NOT NULL"));
            }
            types.add(new Atom("constraint " + table.getTableName() + "_pk primary key (id)"));
        }

        types.toSql(sb, new ArrayList());

        return sb.toString();
    }


    public String toJavaEntityClass(Table table) {
        StringBuilder sb = new StringBuilder();

        sb.append("package se.vgregion.vardplatspusslet.domain;\n");

        sb.append("\nimport javax.persistence.*;\n");
        sb.append("\nimport java.io.Serializable;\n");

        sb.append("\n@Entity");
        sb.append("\n@Table(name = \"ROOM\")".replace("ROOM", table.getTableName()));
        sb.append("\npublic class " + JdbcUtil.toProperCase(JdbcUtil.toCamelCase(table.getTableName()))
            + " extends AbstractEntity {\n");

        boolean hasId = hasPrimaryKeyAtAll(table);

        if (!hasId) {
            sb.append(
                "    @Id\n" +
                    "    @GeneratedValue(strategy = GenerationType.AUTO)\n" +
                    "    private Long id;");
        }

        for (Column column : table.getColumns()) {
            if (column.isPrimary() || column.getColumnName().equalsIgnoreCase("id")) {
                sb.append("\n    @Id");
            }
            sb.append("\n    " + toJavaColumnAnnotationCode(column));
            sb.append("\n    private " + getColumnJavaCodeType(column) + " " + JdbcUtil.toCamelCase(column.getColumnName()) + ";\n");
        }

        if (!hasId) {
            sb.append(
                "    public Long getId() {\n" +
                    "        return id;\n" +
                    "    }\n" +
                    "\n" +
                    "    public void setId(Long id) {\n" +
                    "        this.id = id;\n" +
                    "    }");
        }

        for (Column column : table.getColumns()) {
            sb.append(toGetterCode(column));
            sb.append(toSetterCode(column));
        }

        sb.append("\n\n}");

        return sb.toString();
    }

    private String toGetterCode(Column column) {
        StringBuilder sb = new StringBuilder("");
        String property = JdbcUtil.toCamelCase(column.getColumnName());
        sb.append("\n    public " + getColumnJavaCodeType(column) + " ");
        sb.append("get" + JdbcUtil.toProperCase(property) + "(){\n");
        sb.append("        return " + property + ";");
        sb.append("\n    }\n");
        return sb.toString();
    }

    private String toSetterCode(Column column) {
        StringBuilder sb = new StringBuilder("");
        String property = JdbcUtil.toCamelCase(column.getColumnName());
        sb.append("\n    public void ");
        sb.append("set" + JdbcUtil.toProperCase(property) + "(" + getColumnJavaCodeType(column) + " v){\n");
        sb.append("        this." + property + " = v;");
        sb.append("\n    }\n");
        return sb.toString();
    }

    private String getColumnJavaCodeType(Column column) {
        String name = column.getColumnClassName();
        if (name.startsWith("[")) {
            if (name.startsWith("[B")) {
                return "Byte[]";
            } else {
                throw new RuntimeException("Unknown array type: " + name);
            }
        } else {
            return name;
        }
    }

    private String quote(Object s) {
        return '"' + s.toString() + '"';
    }

    public String toJavaColumnAnnotationCode(Column column) {
        StringBuilder sb = new StringBuilder();
        Junctor<Match> matches = new Junctor<>("@Column (", ", ", ")");
        matches.add(new Match(new Atom("name"), " = ", new Atom(quote(column.getColumnName()))));
        matches.add(new Match(new Atom("nullable"), " = ", new Atom(column.isNullable())));

        String type = column.getColumnTypeName();
        if (!type.equals("text") && column.getColumnClassName().equals(String.class.getName()) && column.getColumnDisplaySize() > 0) {
            matches.add(new Match(new Atom("length"), " = ", new Atom(column.getColumnDisplaySize())));
        }
        matches.toSql(sb, new ArrayList());
        return sb.toString();
    }


    public Properties getTypeTranslations() {
        try (InputStream resource = getClass().getResourceAsStream("SQLServer-PostgreSQL-DataTypes.txt")) {
            List<String> rows =
                new BufferedReader(new InputStreamReader(resource,
                    StandardCharsets.UTF_8)).lines().collect(Collectors.toList());

            Properties result = new Properties();

            for (String row : rows) {
                String[] pair = row.split(Pattern.quote(";"));
                pair[0] = pair[0].replaceAll("\\(.*\\)", "");
                pair[1] = pair[1].replaceAll("\\(.*\\)", "");
                result.put(pair[0], pair[1]);
                result.put(pair[0].toLowerCase(), pair[1].toLowerCase());
                result.put(pair[0].toUpperCase(), pair[1].toLowerCase());
            }

            return result;
        } catch (IOException ioe) {
            throw new RuntimeException(ioe);
        }
    }


    public static String getDatabaseCacheDirectory() {
        String path = new File(".").getAbsolutePath();
        path = path.substring(0, path.length() - 2);
        Path p = Paths.get(path, "database-cache");
        createDirIfNotThere(p);
        return p.toString();
    }

    Path getDataCacheDirectory() {
        Path path = Paths.get(getDatabaseCacheDirectory(), "data");
        createDirIfNotThere(path);
        return path;
    }

    Path getTypesCacheDirectory() {
        Path path = Paths.get(getDatabaseCacheDirectory(), "types");
        createDirIfNotThere(path);
        return path;
    }

    private static void createDirIfNotThere(Path p) {
        if (!Files.exists(p)) {
            try {
                System.out.println("Creates " + p);
                Files.createDirectories(p);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        }
    }

    private boolean hasPrimaryKeyAtAll(Table table) {
        for (Column column : table.getColumns()) {
            if (column.isPrimary() || column.getColumnName().equalsIgnoreCase("id")) {
                return true;
            }
        }
        return false;
    }

    public void createEntitySourceFiles() {
        String projectDir = new File(".").getAbsolutePath();
        projectDir = projectDir.substring(0, projectDir.length() - 2);
        System.out.println(projectDir);
        Path classDest = Paths.get(projectDir, "core-bc", "composites", "types", "src", "main", "java", "se", "vgregion", "vardplatspusslet", "domain");

        for (String s : classDest.toFile().list()) {
            System.out.println(s);
        }
        try {
            for (Table table : mainCon.getSchemas().get(0).getTables()) {
                String javaCode = toJavaEntityClass(table);
                Files.write(
                    Paths.get(classDest.toString(), JdbcUtil.toProperCase(JdbcUtil.toCamelCase(table.getTableName())) + ".java"),
                    javaCode.getBytes()
                );
            }
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

}
