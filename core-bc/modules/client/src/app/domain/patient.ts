import {Patientexamination} from "./patientexamination";
import {PatientEvent} from "./patient-event";
import {CareBurdenChoice} from "./careburdenchoice";
import {DietForMother} from "./dietformother";
import {DietForChild} from "./dietforchild";
import {DietForPatient} from "./dietforpatient";

export class Patient {

  constructor() {
    this.patientEvents = [];
    this.patientExaminations = [];
    this.careBurdenChoices = [];
  }

  id: number;
  label: string;
  leaveStatus: LeaveStatus;
  gender: string;
  leftDate: Date;
  plannedLeaveDate: Date;
  carePlan: string;
  interpreter: boolean;
  interpretInfo: string;
  interpretDate: Date;
  patientExaminations: Patientexamination[];
  akutPatient: boolean;
  electiv23O: boolean;
  electiv24O: boolean;
  vuxenPatient: boolean;
  sekretess: boolean;
  sekretessInfo: string;
  infekterad: boolean;
  infectionSensitive: boolean;
  smitta: boolean;
  smittaInfo: string;
  pal: string;
  patientEvents: PatientEvent[];
  morRond: boolean;
  barnRond: boolean;
  rond: boolean;
  amning: string;
  information: string;
  kommentar: string;
  careBurdenChoices: CareBurdenChoice[];
  dietMother: DietForMother;
  infoDietMother: string;
  dietChild: DietForChild;
  infoDietChild: string;
  diet: DietForPatient;
  infoDiet: string;
}

enum LeaveStatus {
  PERMISSION, TEKNISK_PLATS
}
