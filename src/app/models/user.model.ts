export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'IT' | 'CONSULTANT';
  status: 'active' | 'inactive' | 'archived';
  isConsultant: boolean;
  createdAt?: string;
  updatedAt?: string;
}
