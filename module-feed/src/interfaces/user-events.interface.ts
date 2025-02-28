export interface UserCreatedEvent {
    id: string;
    username: string;
    email: string;
    profileImageUrl?: string;
  }
  
  export interface UserUpdatedEvent {
    id: string;
    username?: string;
    profileImageUrl?: string;
  }
  
  export interface UserDeletedEvent {
    id: string;
  }