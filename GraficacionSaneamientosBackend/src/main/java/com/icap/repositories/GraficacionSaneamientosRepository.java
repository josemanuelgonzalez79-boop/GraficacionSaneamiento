package com.icap.repositories;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.icap.dto.CabeceraReporteDTO;
import com.icap.dto.ObjectDTO;
import com.icap.dto.RecipeDTO;
import com.icap.dto.SanitationProcessDTO;
import com.icap.entities.PasoRawEntity;
import com.icap.entities.RegistroDatoEntity;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class GraficacionSaneamientosRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

        public CabeceraReporteDTO obtenerCabecera(Integer id) {

        return jdbcTemplate.queryForObject(
            """
            SELECT id,
                station,
                object_name,
                recipe_name,
                user_name,
                start_time,
                finish_time,
                return_water,
                water_accum,
                chemical_accum
            FROM cleaning_headers
            WHERE id = :id
            """,
            Map.of("id", id),
            (rs,rowNum) -> CabeceraReporteDTO.builder()
                .id(rs.getInt("id"))
                .station(rs.getInt("station"))
                .objectName(rs.getString("object_name"))
                .recipeName(rs.getString("recipe_name"))
                .userName(rs.getString("user_name"))
                .startTime(rs.getTimestamp("start_time").toLocalDateTime())
                .finishTime(rs.getTimestamp("finish_time").toLocalDateTime())
                .returnWater(rs.getObject("return_water") != null ? ((Number) rs.getObject("return_water")).floatValue() : null)
                .waterAccum(rs.getObject("water_accum") != null ? ((Number) rs.getObject("water_accum")).floatValue() : null)
                .chemicalAccum(rs.getObject("chemical_accum") != null ? ((Number) rs.getObject("chemical_accum")).floatValue() : null)
                .build()
        );
    }

    public List<PasoRawEntity> obtenerPasos(Integer id) {

        String query = """
            SELECT step, update_time
            FROM cleaning_data
            WHERE id = :id
            ORDER BY update_time
        """;

        return jdbcTemplate.query(
            query,
            Map.of("id", id),
            (rs,rowNum) -> new PasoRawEntity(
                rs.getInt("step"),
                rs.getTimestamp("update_time")
            )
        );
    }

    public List<RegistroDatoEntity> obtenerDatosCrudos(Integer id) {
        String query = """
            SELECT update_time, sp_temp, return_temp, supply_temp,
                sp_cond, return_cond, sp_flow, supply_flow
            FROM cleaning_data WHERE id = :id ORDER BY update_time
        """;

        return jdbcTemplate.query(
            query,
            Map.of("id", id),
            (rs, rowNum) -> new RegistroDatoEntity(
                rs.getTimestamp("update_time"),
                asDouble(rs.getObject("sp_temp")),
                asDouble(rs.getObject("return_temp")),
                asDouble(rs.getObject("supply_temp")),
                asDouble(rs.getObject("sp_cond")),
                asDouble(rs.getObject("return_cond")),
                asDouble(rs.getObject("sp_flow")),
                asDouble(rs.getObject("supply_flow"))
            )
        );
    }

    private Double asDouble(Object value) {
        return (value instanceof Number n) ? n.doubleValue() : null;
    }

    public Map<Integer,String> obtenerDescripciones() {

        String query = """
            SELECT step_id, description
            FROM cleaning_steps
        """;

        List<Map<String,Object>> rows = jdbcTemplate.queryForList(query, Map.of());

        Map<Integer,String> result = new HashMap<>();

        for(Map<String,Object> row : rows){

            result.put(
                (Integer)row.get("step_id"),
                (String)row.get("description")
            );
        }

        return result;
    }

    public List<SanitationProcessDTO> obtenerProcesos(
        LocalDate startDate,
        LocalDate endDate,
        Integer station,
        String objectName,
        String recipeName) {

        StringBuilder sql = new StringBuilder("""
            SELECT start_time,
                finish_time,
                id,
                station,
                object_name,
                recipe_name,
                user_name
            FROM cleaning_headers
            WHERE start_time <= :endDate
            AND finish_time >= :startDate
        """);

        Map<String,Object> params = new HashMap<>();

        params.put("startDate", startDate.atStartOfDay());
        params.put("endDate", endDate.plusDays(1).atStartOfDay());

        if(station != null){
            sql.append(" AND station = :station");
            params.put("station", station);
        }

        if(objectName != null){
            sql.append(" AND object_name = :objectName");
            params.put("objectName", objectName);
        }

        if(recipeName != null){
            sql.append(" AND recipe_name = :recipeName");
            params.put("recipeName", recipeName);
        }

        return jdbcTemplate.query(
            sql.toString(),
            params,
            (rs,rowNum) -> SanitationProcessDTO.builder()
                .id(rs.getInt("id"))
                .station(rs.getInt("station"))
                .objectName(rs.getString("object_name"))
                .recipeName(rs.getString("recipe_name"))
                .userName(rs.getString("user_name"))
                .startTime(rs.getTimestamp("start_time").toLocalDateTime())
                .finishTime(
                    rs.getTimestamp("finish_time") != null
                        ? rs.getTimestamp("finish_time").toLocalDateTime()
                        : null
                )
                .build()
        );
    }

    public List<RecipeDTO> obtenerRecetas() {

        String query = """
            SELECT recipe_name
            FROM cleaning_recipes
            ORDER BY recipe_name DESC
        """;

        return jdbcTemplate.query(
            query,
            Map.of(),
            (rs,rowNum) -> RecipeDTO.builder()
                .recipeName(rs.getString("recipe_name"))
                .build()
        );
    }

    public List<ObjectDTO> obtenerObjetos() {

        String query = """
            SELECT object_name
            FROM cleaning_objects
            ORDER BY object_name DESC
        """;

        return jdbcTemplate.query(
            query,
            Map.of(),
            (rs,rowNum) -> ObjectDTO.builder()
                .objectName(rs.getString("object_name"))
                .build()
        );
    }

}