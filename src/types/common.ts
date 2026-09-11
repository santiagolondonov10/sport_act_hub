export interface Responsable {
  id: string;
  nombre: string;
  cargo: string;
  iniciales: string;
  avatarColor: string;
}

export interface Contacto {
  nombre: string;
  cargo: string;
  email: string;
  telefono: string;
}

export interface Marca {
  id: string;
  nombre: string;
  sector: string;
  logoIniciales: string;
  colorMarca: string;
  contacto: Contacto;
}

export type Prioridad = 'Baja' | 'Media' | 'Alta' | 'Urgente';
