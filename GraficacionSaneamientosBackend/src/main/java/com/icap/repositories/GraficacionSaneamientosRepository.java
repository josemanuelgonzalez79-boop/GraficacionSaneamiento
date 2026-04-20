package com.icap.repositories;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import com.icap.entities.ComponentsFullEntity;
import com.icap.entities.ObtenerPasosEntity;
import com.icap.entities.PasoRawEntity;
import com.icap.entities.RegistroDatoEntity;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class GraficacionSaneamientosRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;

    public ComponentsFullEntity fullComponentes(Integer id) {
        return jdbcTemplate.queryForObject(
            """
                SELECT id, station, object_name, recipe_name, user_name, start_time, finish_time, water_accum, chemical_accum 
                FROM cleaning_headers WHERE id = :id
            """,
            Map.of("id", id),
            (rs, rowNum) -> {

                return new ComponentsFullEntity(
                    rs.getInt("id"),
                    rs.getInt("station"),
                    rs.getString("object_name"),
                    rs.getString("recipe_name"),
                    rs.getString("user_name"),
                    rs.getTimestamp("start_time"),
                    rs.getTimestamp("finish_time"),
                    rs.getDouble("water_accum"),
                    rs.getDouble("chemical_accum")
                );
            }
        );
    }

    public List<PasoRawEntity> obtenerPasos(Integer id, String tabla) {

        String query = """
            SELECT step, update_time
            FROM %s
            WHERE id = :id
            ORDER BY step, update_time
        """.formatted(tabla);

        return jdbcTemplate.query(
            query,
            Map.of("id", id),
            (rs, rowNum) -> new PasoRawEntity(
                rs.getInt("step"),
                rs.getTimestamp("update_time")
            )
        );
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

    public List<RegistroDatoEntity> obtenerDatosCrudos(Integer id, String tabla) {

        String query = """
            SELECT update_time,
                sp_temp,
                return_temp,
                supply_temp,
                sp_cond,
                return_cond,
                sp_flow,
                supply_flow
            FROM %s
            WHERE id = :id
            ORDER BY update_time
        """.formatted(tabla);

        return jdbcTemplate.query(
            query,
            Map.of("id", id),
            (rs,rowNum) -> new RegistroDatoEntity(
                rs.getTimestamp("update_time"),

                (Double) rs.getObject("sp_temp"),
                (Double) rs.getObject("return_temp"),
                (Double) rs.getObject("supply_temp"),

                (Double) rs.getObject("sp_cond"),
                (Double) rs.getObject("return_cond"),

                (Double) rs.getObject("sp_flow"),
                (Double) rs.getObject("supply_flow")
            )
        );
    }

    @Transactional
    public void eliminar(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_components SET obsolete = true WHERE component_id = :id
            """,
             Map.of("id",id)
        );
    }

    @Transactional
    public void createComponent(String id, String name, String reference, Integer type){

        jdbcTemplate.update(
            """
                INSERT INTO pb_components (component_id, name, recipe_reference, type) VALUES (:id, :name, :reference, :type)
            """,
             Map.of("id",id,"name",name,"reference",reference,"type",type)
        );
    }

    @Transactional
    public void actualizaComponenteExistente(String id){

        jdbcTemplate.update(
            """
                UPDATE pb_components SET obsolete = false WHERE component_id = :id
                AND version = (SELECT MAX(version)FROM pb_components
                WHERE component_id = :id);
            """,
            Map.of("id",id)
        );
    }

}