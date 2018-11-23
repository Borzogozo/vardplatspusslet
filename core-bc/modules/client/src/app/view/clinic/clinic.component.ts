import { Component, OnInit } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {ActivatedRoute} from "@angular/router";
import {Clinic} from "../../domain/clinic";
import {Unit} from "../../domain/unit";
import {AuthService} from "../../service/auth.service";

@Component({
  selector: 'app-clinic',
  templateUrl: './clinic.component.html',
  styleUrls: ['./clinic.component.scss']
})
export class ClinicComponent implements OnInit {

  clinic: Clinic;
  units: Unit[];
  error: string;

  notFoundText = 'Oops. Inget fanns här...';

  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private authService: AuthService) {
    this.authService.isUserLoggedIn.subscribe(value => {
      this.ngOnInit();
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {

      this.http.get<Clinic>('/api/clinic/' + params.id).subscribe(clinic => {
        if (clinic) {
          this.clinic = clinic;
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

      this.http.get<Unit[]>('/api/unit?clinic=' + params.id).subscribe(units => {
        this.units = units;
      });

    });
  }

}
