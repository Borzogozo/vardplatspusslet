import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Bed} from "../../../domain/bed";
import {Patient} from "../../../domain/patient";
import {Unit} from "../../../domain/unit";
import {HttpClient} from "@angular/common/http";
import {FormArray, FormBuilder, FormGroup} from "@angular/forms";
import {DropdownItem} from "vgr-komponentkartan";
import {Patientexamination} from "../../../domain/patientexamination";
import {e} from "@angular/core/src/render3";

@Component({
  selector: 'app-bed-form',
  templateUrl: './bed-form.component.html',
  styleUrls: ['./bed-form.component.scss']
})
export class BedFormComponent implements OnInit {

  @Input('clinicId') clinicId;
  @Input('unit') unit: Unit;
  @Input('bed') bed;

  @Output('collapse') collapseEvent = new EventEmitter();
  @Output('openDeleteModal') openDeleteModalEvent = new EventEmitter();
  @Output('save') saveEvent = new EventEmitter();

  bedForm: FormGroup;
  prevDate: Date;
  prevInfo: string;

  @Input('genderDropdownItems') genderDropdownItems: DropdownItem<string>[];
  @Input('sskDropdownItems') sskDropdownItems: DropdownItem<number>[];
  @Input('leaveStatusesDropdownItems') leaveStatusesDropdownItems: DropdownItem<string>;
  @Input('servingKlinikerDropdownItems') servingKlinikerDropdownItems: DropdownItem<number>[];

  constructor(private http: HttpClient,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.initForm(this.bed);
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
        carePlan: [bed.patient ? bed.patient.carePlan : null],
        tolkGroup: this.formBuilder.group({
          interpreter : [bed.patient? bed.patient.interpreter: null ],
          interpretDate: [bed.patient? bed.patient.interpretDate: null],
          interpretInfo: [bed.patient? bed.patient.interpretInfo: null]
        }),
        patientExaminations: this.formBuilder.array(this.buildExaminationGroup(bed.patient? bed.patient.patientExaminations: null))
      }),
      ssk: bed.ssk ? bed.ssk.id : null,
      waitingforbedGroup: this.formBuilder.group({
        servingKlinik: [bed.servingClinic!= null ? bed.servingClinic.id: null],
        waitingpatient: [bed.patientWaits ? bed.patientWaits: null]
        }
      )
    });

    this.bedForm.get('patient.tolkGroup.interpreter').valueChanges
      .subscribe((checked: boolean) => {
        if (!checked || checked == null) {
          this.prevDate = this.bedForm.get('patient.tolkGroup.interpretDate').value;
          this.prevInfo = this.bedForm.get('patient.tolkGroup.interpretInfo').value;
          this.bedForm.get('patient.tolkGroup.interpretDate').setValue(null);
          this.bedForm.get('patient.tolkGroup.interpretInfo').setValue(null);
        }
        else if (checked)
        {
          if (this.bedForm.get('patient.tolkGroup.interpretDate').value == null
          && this.bedForm.get('patient.tolkGroup.interpretInfo').value == null)
          {
            this.bedForm.get('patient.tolkGroup.interpretDate').setValue(this.prevDate);
            this.bedForm.get('patient.tolkGroup.interpretInfo').setValue(this.prevInfo);
          }
        }
      });
  }

  private reinitForm(bed: Bed) {
    if (!bed) {
      bed = new Bed();
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
      bed.patient.interpreter = bedModel.patient.tolkGroup.interpreter? bedModel.patient.tolkGroup.interpreter : null;
      bed.patient.interpretDate = bedModel.patient.tolkGroup.interpretDate? bedModel.patient.tolkGroup.interpretDate: null;
      bed.patient.interpretInfo = bedModel.patient.tolkGroup.interpretInfo? bedModel.patient.tolkGroup.interpretInfo: null;
      bed.patient.patientExaminations = bedModel.patient.patientExaminations? bedModel.patient.patientExaminations: null;

    } else {
      bed.patient = null;
    }

    if (bedModel.ssk) {
      bed.ssk = this.unit.ssks.find(ssk => ssk.id === bedModel.ssk);
    }

    if (bedModel.waitingforbedGroup.servingKlinik) {
      bed.servingClinic = this.unit.servingClinics.find(klinik => klinik.id === bedModel.waitingforbedGroup.servingKlinik);
    }
    bed.patientWaits = bedModel.waitingforbedGroup.waitingpatient;

    this.http.put('/api/bed/' + this.clinicId + '/' + this.unit.id, bed)
      .subscribe(bed => {
        // this.ngOnInit();
        this.saveEvent.emit();
      });
  }

  cancel() {
    this.collapseEvent.emit();
  }

  openDeleteModal(bed: Bed) {
    this.openDeleteModalEvent.emit();
  }

  private buildExaminationGroup(examinations: Patientexamination[]): FormGroup[]{
    if (!examinations || examinations.length === 0) {
      return [];
    }
    return examinations.map(examinationklinik => {
      return this.formBuilder.group({
        id: examinationklinik.id,
        examination: examinationklinik.examination,
        examinationDate: examinationklinik.examinationDate,
        examinationtime: examinationklinik.examinationtime
      })
    });
  }

  CreateSPatientExamination(): FormGroup{
    return this.formBuilder.group({
      id: null,
      examination: null,
      examinationDate: null,
      examinationtime: null
    });
  }

  deleteExamination(index: number) {
    this.patientExaminations.removeAt(index);
  }

  get patientExaminations(): FormArray{
    return <FormArray>this.bedForm.get('patient.patientExaminations');
  }


  addExamination(){
    this.patientExaminations.push(this.CreateSPatientExamination());
  }
}
