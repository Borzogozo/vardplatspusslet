package se.vgregion.vardplatspusslet.intsvc.controller.util;

import com.auth0.jwt.interfaces.DecodedJWT;
import se.vgregion.vardplatspusslet.service.JwtUtil;

import javax.servlet.http.HttpServletRequest;
import java.util.Optional;

/**
 * @author Patrik Björk
 */
public class HttpUtil {

    public static Optional<String> getUserIdFromRequest(HttpServletRequest request) {
        String userId;

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return Optional.empty();
        } else {

            String jwtToken = authorizationHeader.substring("Bearer".length()).trim();

            DecodedJWT jwt;
            jwt = JwtUtil.verify(jwtToken);

            userId = jwt.getSubject();
        }
        return Optional.of(userId);
    }
}
