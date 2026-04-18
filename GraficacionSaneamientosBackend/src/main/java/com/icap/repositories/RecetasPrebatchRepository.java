package com.icap.repositories;

import java.time.Duration;
import java.util.Map;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import com.icap.entities.ComponentsFullEntity;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class RecetasPrebatchRepository {

    private final NamedParameterJdbcTemplate jdbcTemplate;


    public ComponentsFullEntity fullComponentes(String id) {
        return jdbcTemplate.queryForObject(
            """
                SELECT component_id, name, recipe_reference, mass, water, temp, obsolete, comments,
                type, update_time, version, bayonet, hard, agitation_automatic, agitation_duration,
                circulate, no_inventory_validation, liquids_tank, direct_water_load
                FROM pb_components
                WHERE obsolete = false AND component_id = :id LIMIT 1
            """,
            Map.of("id", id),
            (rs, rowNum) -> {
                //Conversión segura del campo interval (hh:mm:ss) a java.time.Duration
                String intervalStr = rs.getString("agitation_duration");
                Duration agitationDuration = null;
                if (intervalStr != null) {
                    String[] parts = intervalStr.split(":");
                    int hours = Integer.parseInt(parts[0]);
                    int minutes = Integer.parseInt(parts[1]);
                    int seconds = Integer.parseInt(parts[2]);
                    agitationDuration = Duration.ofHours(hours)
                                                .plusMinutes(minutes)
                                                .plusSeconds(seconds);
                }

                return new ComponentsFullEntity(
                    rs.getString("component_id"),
                    rs.getString("name"),
                    rs.getString("recipe_reference"),
                    rs.getDouble("mass"),
                    rs.getDouble("water"),
                    rs.getDouble("temp"),
                    rs.getBoolean("obsolete"),
                    rs.getString("comments"),
                    rs.getInt("type"),
                    rs.getTimestamp("update_time"),
                    rs.getInt("version"),
                    rs.getBoolean("bayonet"),
                    rs.getBoolean("hard"),
                    rs.getBoolean("agitation_automatic"),
                    agitationDuration,
                    rs.getBoolean("circulate"),
                    rs.getBoolean("no_inventory_validation"),
                    rs.getBoolean("liquids_tank"),
                    rs.getBoolean("direct_water_load")
                );
            }
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