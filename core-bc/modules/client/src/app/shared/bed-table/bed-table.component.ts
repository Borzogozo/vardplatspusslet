import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {Unit} from "../../domain/unit";
import {Clinic} from "../../domain/clinic";
import {DropdownItem} from "../../domain/DropdownItem";
import {SelectableItem} from "vgr-komponentkartan";
import {Bed} from "../../domain/bed";
import {DeleteModalComponent} from "../../elements/delete-modal/delete-modal.component";
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {HttpClient} from "@angular/common/http";
import {SevenDaysPlaningUnit} from "../../domain/seven-days-planing-unit";
import {CareBurdenChoice} from "../../domain/careburdenchoice";
import {CareBurdenCategory} from "../../domain/careBurdenCategory";
import {Patient} from "../../domain/patient";
import {CareBurdenValue} from "../../domain/careburdenvalue";

@Component({
  selector: 'app-bed-table',
  templateUrl: './bed-table.component.html',
  styleUrls: ['./bed-table.component.scss', '../../view/unit/unit.component.scss']
})
export class BedTableComponent implements OnInit {

  @ViewChild(DeleteModalComponent) appDeleteModal: DeleteModalComponent;

  @Input('unit') unit: Unit;
  @Input('clinic') clinic: Clinic;

  @Output('save') saveEvent = new EventEmitter();

  addBedForm: FormGroup;

  bedForDeletion: Bed;

  careBurdenValuesOptions: DropdownItem<number>[];
  amningOptions: SelectableItem<number>[];
  genderDropdownItems: SelectableItem<string>[];
  informationOptions: SelectableItem<number>[];
  dietMotherDropdownItems: DropdownItem<number>[];
  dietChildDropdownItems: DropdownItem<number>[];
  dietDropdownItems: DropdownItem<number>[];
  leaveStatusesDropdownItems: DropdownItem<string>[];
  sskDropdownItems: DropdownItem<number>[];
  servingKlinikerDropdownItems: DropdownItem<number>[];
  cleaningAlternativesDropdownItems: DropdownItem<number>[];
  expandedRows: Array<boolean>;
  delayedExpandedRows: Array<boolean>;

  constructor(private http: HttpClient,
              private formBuilder: FormBuilder) { }

  ngOnInit() {

    this.initThings();

  }

  openDeleteModal(bed: Bed) {
    this.bedForDeletion = bed;
    this.appDeleteModal.open();
  }

  toggleRow(index) {
    let newState = !this.expandedRows[index];
    this.expandedRows = new Array<boolean>();
    this.delayedExpandedRows = new Array<boolean>();
    this.expandedRows[index] = newState;
    setTimeout(() => {
      this.delayedExpandedRows[index] = newState;
    });
  }

  collapse(index) {
    this.expandedRows[index] = false;
  }

  onSave(i) {
    this.saveEvent.emit();
    this.collapse(i);
  }

  saveAddBed() {
    let bed = new Bed();
    let bedModel = this.addBedForm.value;

    bed.label = bedModel.label;

    this.http.put('/api/bed/' + this.clinic.id + '/' + this.unit.id, bed)
      .subscribe(bed => {
        this.initAddBedForm();
        this.saveEvent.emit();
      });
  }

  confirmDelete() {
    this.http.delete('/api/bed/' + this.clinic.id + '/' + this.unit.id + '/' + this.bedForDeletion.id)
      .subscribe(() => {
        this.expandedRows = new Array<boolean>();
        this.saveEvent.emit();
      });
  }

  initThings() {
    this.expandedRows = new Array(this.unit.beds.length);
    this.delayedExpandedRows = new Array(this.unit.beds.length);

    this.initAddBedForm();

    this.careBurdenValuesOptions = [{displayName: 'Välj', value: null}].concat(this.unit.careBurdenValues.map(cbv => {
      return {displayName: cbv.name, value: cbv.id};
    }));

    this.amningOptions = [
      {displayName: 'Normal amning', value: 1},
      {displayName: 'Amningshjälp', value: 2},
      {displayName: 'Amningsmottagning ', value: 3}
    ];

    this.genderDropdownItems = [
      {displayName: 'Välj', value: null},
      {displayName: 'Kvinna', value: 'KVINNA'},
      {displayName: 'Man', value: 'MAN'},
      {displayName: 'Barn', value: 'BARN'}
    ];

    this.informationOptions = [
      {displayName: 'THG', value: 1},
      {displayName: 'THG/Barn', value: 2},
      {displayName: 'Föräldrarum', value: 3}
    ];

    this.dietMotherDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.dietForMothers.map(diet => {
      return {displayName: diet.name, value: diet.id};
    }));

    this.dietChildDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.dietForChildren.map(diet => {
      return {displayName: diet.name, value: diet.id};
    }));

    this.dietDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.dietForPatients.map(diet => {
      return {displayName: diet.name, value: diet.id};
    }));

    this.leaveStatusesDropdownItems = [
      {displayName: 'Välj', value: null},
      {displayName: 'Permission', value: 'PERMISSION'},
      {displayName: 'Teknisk plats', value: 'TEKNISK_PLATS'}
    ];

    this.sskDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.ssks.map(ssk => {
      return {displayName: ssk.label, value: ssk.id};
    }));

    this.servingKlinikerDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.servingClinics.map(klinik => {
      return {displayName: klinik.name, value: klinik.id};
    }));

    this.cleaningAlternativesDropdownItems = [{displayName: 'Välj', value: null}].concat(this.unit.cleaningAlternatives.map(cg => {
      return {displayName: cg.description, value: cg.id};
    }));

  }

  private initAddBedForm() {
    this.addBedForm = this.formBuilder.group({
      id: null,
      label: [null, Validators.required]
    });
  }

  getCareBurdenValue(cbc: CareBurdenCategory, careBurdenChoices: CareBurdenChoice[]): CareBurdenValue {
    if (!careBurdenChoices) {
      return null;
    }

    let careBurdenChoice = careBurdenChoices.find(choice => choice.careBurdenCategory.id === cbc.id);

    if (!careBurdenChoice) {
      return null;
    }

    let careBurdenValue = careBurdenChoice.careBurdenValue;
    return careBurdenValue ? careBurdenValue : null;
  }

  toInterpreterString(patient: Patient): string {
    let text = 'Tolk: ';

    if (patient.interpretDate) {
      text += this.formatDate(patient.interpretDate);
    }

    if (patient.interpretDate && patient.interpretInfo) {
      text += ', ';
    }

    if (patient.interpretInfo) {
      text += patient.interpretInfo;
    }

    return text;
  }

  formatDate(date: any) {
    return new Date(date).toLocaleDateString();
  }
}
