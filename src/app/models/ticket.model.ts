export enum IssueType {
  DAMAGED = 'damaged',
  DESTROYED = 'destroyed',
  MALFUNCTION = 'malfunction',
  OTHER = 'other',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ResolutionType {
  REPAIR = 'repair',
  REPLACE = 'replace',
}

export interface TicketComment {
  author?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  text: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  device?: {
    _id: string;
    name: string;
    type: string;
  };
  issueType: IssueType;
  status: TicketStatus;
  priority: TicketPriority;
  resolution?: ResolutionType;
  createdBy?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  assignedTo?: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  comments?: TicketComment[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketDto {
  title: string;
  description: string;
  deviceId: string;
  issueType: IssueType;
  priority?: TicketPriority;
}

export interface UpdateTicketStatusDto {
  status?: TicketStatus;
  resolution?: ResolutionType;
}

export interface AssignTicketDto {
  assignedTo: string;
}

export interface AddCommentDto {
  text: string;
}