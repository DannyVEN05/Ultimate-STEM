export class User {
  user_id: string;
  user_firstname: string;
  user_lastname: string;
  user_email: string;
  user_created_at: Date;
  user_role: string;

  constructor(
    id: string = "",
    firstname: string = "",
    lastname: string = "",
    email: string = "",
    created_at: Date = new Date(),
    role: string = "user"
  ) {
    this.user_id = id;
    this.user_firstname = firstname;
    this.user_lastname = lastname;
    this.user_email = email;
    this.user_created_at = created_at;
    this.user_role = role;
  }
}
