export interface DialogEntry {
  background: string;
  standing?: string;
  msg_type: string;
  speaker?: string;
  message: string;
}

export interface DialogData {
  id: string;
  title: string;
  steps: DialogEntry[];
}
