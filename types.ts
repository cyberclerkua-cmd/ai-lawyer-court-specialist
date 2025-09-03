
export interface Source {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  file?: {
    name: string;
    type: string;
  };
  sources?: Source[];
}
