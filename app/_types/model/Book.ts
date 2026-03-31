import { Concept } from "./Concept";
import { TournamentSubmission } from "./TournamentSubmission";

export class Book {
  concept: Concept;
  tournamentsub: TournamentSubmission;

  constructor(
    concept: Concept,
    tournamentsub: TournamentSubmission
  ){
    this.concept = concept;
    this.tournamentsub = tournamentsub;
  }
}
