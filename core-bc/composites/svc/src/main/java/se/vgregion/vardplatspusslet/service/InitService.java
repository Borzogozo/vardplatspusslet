package se.vgregion.vardplatspusslet.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import se.vgregion.vardplatspusslet.domain.jpa.Bed;
import se.vgregion.vardplatspusslet.domain.jpa.Clinic;
import se.vgregion.vardplatspusslet.domain.jpa.Unit;
import se.vgregion.vardplatspusslet.repository.BedRepository;
import se.vgregion.vardplatspusslet.repository.ClinicRepository;
import se.vgregion.vardplatspusslet.repository.UnitRepository;

import javax.annotation.PostConstruct;
import java.util.ArrayList;

@Service
@Transactional
public class InitService {

    @Autowired
    private ClinicRepository clinicRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private BedRepository bedRepository;

    @PostConstruct
    public void init() {

        if (clinicRepository.findAll().size() > 0) {
            return;
        }

        Clinic clinic1 = new Clinic("kli1", "Klinik 1");

        clinicRepository.save(clinic1);

        Unit unit1 = new Unit();
        unit1.setId("avd1");
        unit1.setName("Avdelning 1");
        unit1.setHasLeftDateFeature(true);
        unit1.setClinic(clinic1);

        Bed bed11 = new Bed();
        bed11.setLabel("1:1");
        bed11.setOccupied(false);

        Bed bed21 = new Bed();
        bed21.setLabel("2:1");
        bed21.setOccupied(false);

        ArrayList<Bed> beds = new ArrayList<>();
        beds.add(bed11);
        beds.add(bed21);

        unitRepository.save(unit1);

        bedRepository.save(bed11);
        bedRepository.save(bed21);

        unit1.setBeds(beds);

        unitRepository.save(unit1);
    }
}
