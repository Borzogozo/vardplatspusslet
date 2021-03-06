import {Patient} from "./patient";
import {Bed} from "./bed";
import {Clinic} from "./clinic";
import {Ssk} from "./ssk";
import {ServingClinic} from "./servingclinic";
import {Message} from "./message";
import {CleaningAlternative} from "./cleaning-alternative";
import {CareBurdenValue} from "./careburdenvalue";
import {CareBurdenCategory} from "./careBurdenCategory";
import {DietForMother} from "./dietformother";
import {DietForChild} from "./dietforchild";
import {DietForPatient} from "./dietforpatient";
import {UnitPlannedIn} from "./unit-planned-in";
import {SevenDaysPlaningUnit} from "./seven-days-planing-unit";

export class Unit {
  id: string;
  name: string;
  beds: Bed[];
  clinic: Clinic;
  patients: Patient[];
  ssks: Ssk[];
  messages: Message[];
  servingClinics: ServingClinic[];
  dietForMothers: DietForMother[];
  dietForChildren: DietForChild[];
  dietForPatients: DietForPatient[];
  hasLeftDateFeature: boolean;
  hasCarePlan: boolean;
  hasAkutPatientFeature: boolean;
  has23oFeature: boolean;
  has24oFeature: boolean;
  hasVuxenPatientFeature: boolean;
  hasSekretessFeature: boolean;
  hasInfekteradFeature: boolean;
  hasInfectionSensitiveFeature: boolean;
  hasSmittaFeature: boolean;
  cleaningAlternatives: CleaningAlternative[];
  hasCleaningFeature: boolean;
  hasPalFeature: boolean;
  hasHendelseFeature: boolean;
  hasMorRondFeature: boolean;
  hasBarnRondFeature: boolean;
  hasRondFeature: boolean;
  hasAmningFeature: boolean;
  hasInfoFeature: boolean;
  careBurdenCategories: CareBurdenCategory[];
  careBurdenValues: CareBurdenValue[];
  hasCareBurdenWithAverage: boolean;
  hasCareBurdenWithText: boolean;
  hasMorKostFeature: boolean;
  hasBarnKostFeature: boolean;
  hasKostFeature: boolean;
  hasMotherChildDietFeature: boolean;
  hasUnitPlannedInFeature: boolean;
  unitsPlannedIn: UnitPlannedIn[];
  sevenDaysPlaningUnits: SevenDaysPlaningUnit[];
}
