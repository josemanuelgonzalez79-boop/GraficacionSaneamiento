package com.icap.constants;

/**
 * AppMessages
 */
public class AppMessages {
    private AppMessages() {
        throw new IllegalStateException("No existe un constructor para la clase AppMessages");
    }
    public static final String CLIENT_ERROR = "CLIENT_ERROR";
    public static final String UNAUTHORISED_MESSAGE = "Usted no está autorizado para acceder este recurso.";
    public static final String INICIA_TRANSACCION = "Inicia Transaccion.";
    public static final String FINALIZA_TRANSACCION = "La Transaccion Finalizo con Exito.";
    public static final String FALLO_TRANSACCION = "Fallo Transaccion.";
    public static final String GET_BODEGA = "getBodega";
    public static final String OBTAINCOMPONENTS = "obtainComponents";
    public static final String OBTAINFULLCOMPONENTS = "obtainFullComponents";
    public static final String VALIDATEDELETE = "validateDelete";
    public static final String DELETECOMPONENT = "deleteComponent";
    public static final String VALIDANOOBSOLETO = "validaNoObsoleto";
    public static final String VALIDAOBSOLETO = "validaObsoleto";
    public static final String CREACOMPONENTE = "creaComponente";
    public static final String COMPONENTEEXISTENTE = "componenteExistente";
    public static final String GUARDACOMPONENTE = "guardaComponente";
    public static final String ACTUALIZAGUARDADOCOMPONENTE = "actualizaGuardadoComponente";
    public static final String OBTENERFAMILIAS = "obtenerFamilias";
    public static final String OBTENERMAESTROARTICULOS = "obtenerMaestroArticulos";
    public static final String ALTAARTICULOS = "altaArticulos";
    public static final String BAJAARTICULOS = "bajaArticulos";
    public static final String CAMBIOARTICULOS = "cambioArticulos";

}