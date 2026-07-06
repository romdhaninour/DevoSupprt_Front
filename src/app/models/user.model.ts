export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'IT' | 'CONSULTANT';
  status: 'active' | 'inactive' | 'archived';
  isConsultant: boolean;
  profilePicture?: string;
  phone?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}
