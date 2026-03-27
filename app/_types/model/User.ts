export class User {
  user_id: string;
  user_firstname: string;
  user_lastname: string
  user_email: string;
  user_phone_number: string;
  user_dob: Date | null;
  user_created_at: Date;
  user_role: string;

  constructor(
    id: string = "",
    firstname: string = "",
    lastname: string = "",
    email: string = "",
    phone_number: string = "",
    dob: Date | null = null,
    created_at: Date = new Date(),
    role: string = "user"
  ) {
    this.user_id = id;
    this.user_firstname = firstname;
    this.user_lastname = lastname;
    this.user_email = email;
    this.user_phone_number = phone_number;
    this.user_dob = dob;
    this.user_created_at = created_at;
    this.user_role = role;
  }
}
