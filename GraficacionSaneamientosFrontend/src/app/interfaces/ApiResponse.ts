export interface MetaDTO {
    statusCode: number;
  }
  
  export interface ApiResponseDTO {
    meta: MetaDTO;
    data?: any;
    message?: string;
  }