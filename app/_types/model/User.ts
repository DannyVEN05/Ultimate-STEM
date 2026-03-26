export class User {
  user_id: string;
  user_firstname: string;
  user_lastname: string
  user_email: string;
  user_phonenumber: string;
  user_dob: Date;
  user_createdat: Date;

  constructor(
    id: string = "",
    firstname: string = "",
    lastname: string = "",
    email: string = "",
    phonenumber: string = "",
    dob: Date = new Date(),
    createdat: Date = new Date()
  ) {
    this.user_id = id;
    this.user_firstname = firstname;
    this.user_lastname = lastname;
    this.user_email = email;
    this.user_phonenumber = phonenumber;
    this.user_dob = dob;
    this.user_createdat = createdat;
  }
}
