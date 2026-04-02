import { Concept } from "./Concept";
import { TournamentSubmission } from "./TournamentSubmission";

export class Book {
  concept: Concept;
  tournamentSubmission: TournamentSubmission;

  constructor(
    concept: Concept,
    tournamentSubmission: TournamentSubmission
  ){
    this.concept = concept;
    this.tournamentSubmission = tournamentSubmission;
  }
}
