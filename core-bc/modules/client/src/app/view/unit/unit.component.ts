import {Component, OnInit, ViewChild} from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {Unit} from "../../domain/unit";
import {DropdownItem, ListItemComponent} from "vgr-komponentkartan";
import {Bed} from "../../domain/bed";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Patient} from "../../domain/patient";
import {Clinic} from "../../domain/clinic";
import {DeleteModalComponent} from "../../elements/delete-modal/delete-modal.component";
import {Ssk} from "../../domain/ssk";

@Component({
  selector: 'app-unit',
  templateUrl: './unit.component.html',
  styleUrls: ['./unit.component.scss']
})
export class UnitComponent implements OnInit {

  unit: Unit;
  clinic: Clinic;

  genderDropdownItems: DropdownItem<string>[];
  sskDropdownItems: DropdownItem<number>[];
  leaveStatusesDropdownItems = [
    {
      displayName: 'Permission', value: 'PERMISSION'
    },
    {
      displayName: 'Teknisk plats', value: 'TEKNISK_PLATS'
    },
    {
      displayName: 'Tillfällig hemgång', value: 'TILLFÄLLIG_HEMGÅNG'
    },
    {
      displayName: 'Bebis???', value: 'BEBIS'
    },
    {
      displayName: 'Föräldrarum', value: 'FÖRÄLDRARUM'
    }];

  error: string;
  notFoundText = 'Oops. Inget fanns här...';

  bedForm: FormGroup;
  bedForDeletion: Bed;

  vacantBeds: DropdownItem<number>[];

  @ViewChild(DeleteModalComponent) appDeleteModal: DeleteModalComponent;

  chosenVacantBedId: number;

  showChangeBedOrder = false;
  bedsOrder: Bed[] = [];

  constructor(private http: HttpClient,
              private formBuilder: FormBuilder,
              private route: ActivatedRoute) {

    this.genderDropdownItems = [
      {displayName: 'Kvinna', value: 'KVINNA'},
      {displayName: 'Man', value: 'MAN'},
      {displayName: 'Barn', value: 'BARN'}
    ];

    window.setInterval(() => this.checkForChanges(), 10000);
  }

  ngOnInit() {

    this.route.params.subscribe(params => {

      let clinicId = params.clinicId;

      this.http.get<Clinic>('/api/clinic/' + clinicId).subscribe(clinic => {
        this.clinic = clinic;
      });

      this.http.get<Unit>('/api/unit/' + clinicId + '/' + params.id).subscribe(unit => {
        if (unit) {
          this.unit = unit;

          this.sskDropdownItems = unit.ssks.map(ssk => {
            return {displayName: ssk.label, value: ssk.id};
          });

          this.updateVacants(unit);

          this.initForm(null);
        } else {
          this.error = this.notFoundText;
        }
      }, (error1: HttpErrorResponse) => {
        console.log(error1);
        if (error1.status === 404) {
          this.error = this.notFoundText;
        } else {
          this.error = error1.message;
        }
      });

    });
  }

  private updateVacants(unit) {
    this.vacantBeds = unit.beds
      .filter(bed => !bed.occupied)
      .map(bed => {
        return {
          displayName: bed.label,
          value: bed.id
        }
      });
  }

  private checkForChanges() {
    let params = this.route.snapshot.params;

    let clinicId = params.clinicId;

    this.http.get<Clinic>('/api/clinic/' + clinicId).subscribe(clinic => {
      this.clinic = clinic;
    });

    this.http.get<Unit>('/api/unit/' + clinicId + '/' + params.id).subscribe(unit => {
      for (let incomingBed of unit.beds) {
        let thisBed = null as Bed;

        let found = this.unit.beds.find(bed => bed.id === incomingBed.id);
        if (found) {
          thisBed = found;

          thisBed.occupied = incomingBed.occupied;
          thisBed.label = incomingBed.label;
          thisBed.patient = incomingBed.patient;
        }
      }

      for (let incomingPatient of unit.patients) {
        let thisPatient = null as Patient;

        let found = this.unit.patients.find(patient => patient.id === incomingPatient.id);
        if (found) {
          thisPatient = found;

          thisPatient.leaveStatus = incomingPatient.leaveStatus;
          thisPatient.label = incomingPatient.label;
          thisPatient.gender = incomingPatient.gender;
        } else {
          // Not found means it is a new patient
          this.unit.patients.push(incomingPatient);
        }
      }

      // We also need to look for patients which should not belong to the unit anymore.
      for (let thisPatient of this.unit.patients) {
        let found = unit.patients.find(patient => patient.id === thisPatient.id);
        if (!found) {
          this.unit.patients.splice(this.unit.patients.indexOf(thisPatient), 1);
        }
      }

      this.updateVacants(unit);
    });
  }

  private initForm(bed: Bed) {
    if (!bed) {
      bed = new Bed();
    }

    this.bedForm = this.formBuilder.group({
      id: [bed.id],
      occupied: [bed.occupied],
      label: [bed.label],
      patient: this.formBuilder.group({
        id: [bed.patient ? bed.patient.id : null],
        label: [bed.patient ? bed.patient.label : null],
        leaveStatus: [bed.patient ? bed.patient.leaveStatus : null],
        gender: [bed.patient ? bed.patient.gender : null],
        leftDate: [bed.patient ? bed.patient.leftDate : null],
        plannedLeaveDate: [bed.patient ? bed.patient.plannedLeaveDate : null],
        carePlan: [bed.patient ? bed.patient.carePlan : null]
      }),
      ssk: bed.ssk ? bed.ssk.id : null
    });

  }

  private reinitForm(bed: Bed) {
    if (!bed) {
      bed = new Bed();
    }

    this.bedForm.setValue({
      id: bed.id ? bed.id : null,
      occupied: bed.occupied ? bed.occupied : null,
      label: bed.label ? bed.label : null,
      patient: {
        id: bed.patient ? bed.patient.id : null,
        label: bed.patient ? bed.patient.label : null,
        leaveStatus: bed.patient ? bed.patient.leaveStatus : null,
        gender: bed.patient ? bed.patient.gender : null,
        leftDate: bed.patient ? bed.patient.leftDate : null,
        plannedLeaveDate: bed.patient ? bed.patient.plannedLeaveDate : null,
        carePlan: [bed.patient ? bed.patient.carePlan : null]
      },
      ssk: bed.ssk ? bed.ssk.id : null
    });
  }

  changeBedOrder() {
    this.bedsOrder = this.unit.beds;
    this.showChangeBedOrder = true;
  }

  hideChangeBedOrder() {
    this.showChangeBedOrder = false;
  }

  saveBedOrder() {
    this.unit.beds = this.bedsOrder;
    this.showChangeBedOrder = false;
    this.http.put('/api/unit', this.unit)
      .subscribe(unit => {

      });
  }

  setCurrentBed(event: any, bed: Bed) {
    if (event) {
      // Then the row is expanded and not collapsed.
      this.reinitForm(bed);
    }
  }

  save() {
    let bed = new Bed();
    let bedModel = this.bedForm.value;

    bed.id = bedModel.id;
    bed.label = bedModel.label;
    bed.occupied = !!bedModel.occupied;

    if (bedModel.patient.label) {
      bed.patient = new Patient();
      bed.patient.id = bedModel.patient.id;
      bed.patient.label = bedModel.patient.label;
      bed.patient.leaveStatus = bedModel.patient.leaveStatus;
      bed.patient.leftDate = bedModel.patient.leftDate;
      bed.patient.gender = bedModel.patient.gender ? bedModel.patient.gender : null;
      bed.patient.plannedLeaveDate = bedModel.patient.plannedLeaveDate ? bedModel.patient.plannedLeaveDate : null;
      bed.patient.carePlan = bedModel.patient.carePlan ? bedModel.patient.carePlan : null;
    } else {
      bed.patient = null;
    }

    if (bedModel.ssk) {
      bed.ssk = this.unit.ssks.find(ssk => ssk.id === bedModel.ssk);
    }

    this.http.put('/api/bed/' + this.clinic.id + '/' + this.unit.id, bed)
      .subscribe(bed => {
        this.ngOnInit();
      });
  }

  collapse(element: ListItemComponent) {
    element.setExpandOrCollapsed();
  }

  openDeleteModal(bed: Bed) {
    this.bedForDeletion = bed;
    this.appDeleteModal.open();
  }

  confirmDelete() {
    this.http.delete('/api/bed/' + this.clinic.id + '/' + this.unit.id + '/' + this.bedForDeletion.id)
      .subscribe(() => {
        this.ngOnInit();
      }); // todo error handling
  }

  chooseBedForLeavePatient(patient) {
    if (!this.chosenVacantBedId) {
      return;
    }

    patient.leaveStatus = null;

    let bed = this.unit.beds.find(bed => bed.id === this.chosenVacantBedId);
    bed.patient = patient;
    bed.occupied = true;
    this.http.put('/api/bed/' + this.clinic.id + '/' + this.unit.id, bed)
      .subscribe(bed => {
        this.ngOnInit();
      });
  }

  countBeds(sskArg: Ssk) {
    // Map to ssk, then filter out those with the same id and count the result.
    return this.unit.beds.map(bed => bed.ssk).filter(ssk => ssk ? ssk.id === sskArg.id : false).length;
  }

  // To initial capital letter and lower case after first letter. Also replace underscore with space.
  format(input: string) {
    if (!input) {
      return null;
    }

    if (input.length === 0) {
      return '';
    }

    return input.substr(0, 1).toUpperCase() + input.substr(1, input.length - 1).toLowerCase().replace('_', ' ');
  }
}
