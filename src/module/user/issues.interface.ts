export interface IIssues {
  title: string;
  description: string;
  type: string;
  reporter_id?: number;
  name?:string;
  role?:string;
  status?:string;
}