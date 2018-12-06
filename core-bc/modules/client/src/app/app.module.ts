import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {ClinicComponent} from './view/clinic/clinic.component';
import {HomeComponent} from './view/home/home.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {UnitComponent} from './view/unit/unit.component';
import {KomponentkartanModule} from "vgr-komponentkartan";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {ChevronRightComponent} from './elements/chevron-right/chevron-right.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AuthService} from "./service/auth.service";
import {AdminComponent} from './view/admin/admin.component';
import {ClinicsAdminComponent} from './view/admin/clinics-admin/clinics-admin.component';
import {UnitsAdminComponent} from './view/admin/units-admin/units-admin.component';
import {DeleteModalComponent} from './elements/delete-modal/delete-modal.component';
import {JwtModule} from "@auth0/angular-jwt";
import {DragulaModule} from "ng2-dragula";
import {UsersAdminComponent} from './view/admin/users-admin/users-admin.component';
import {registerLocaleData} from "@angular/common";
import localeSv from "@angular/common/locales/sv";
import {UnitsAdminFormComponent} from './view/admin/units-admin/units-admin-form/units-admin-form.component';
import {CalloutComponent} from './shared/callout.component';
import {CalloutDirective} from './shared/callout.directive';
import {AngularFontAwesomeModule} from "angular-font-awesome";
import {BedFormComponent} from './view/unit/bed-form/bed-form.component';
import {RowComponent} from './elements/row/row.component';
import {LeftColumnComponent} from './elements/left-column/left-column.component';
import {MenuComponent} from './elements/menu/menu.component';
import {MenuTitleRowComponent} from './elements/menu-title-row/menu-title-row.component';
import {RightColumnComponent} from './elements/right-column/right-column.component';
import {LoginModalComponent} from './elements/login-modal/login-modal.component';
import {EditMessagesComponent} from './view/unit/edit-messages/edit-messages.component';
import {MessageComponent} from './elements/message/message.component';
import {EditMessageComponent} from './elements/edit-message/edit-message.component';
import {CKEditorModule} from "ng2-ckeditor";
import {JwtHttpInterceptor} from "./interceptor/jwt-http-interceptor";
import {AdminGuard} from "./guard/admin.guard";
import {UserLoggedInGuard} from "./guard/user-logged-in.guard";
import {HasEditUnitPermissionGuard} from "./guard/has-edit-unit-permission.guard";

registerLocaleData(localeSv, "sv-SE");

@NgModule({
  declarations: [
    AppComponent,
    ClinicComponent,
    HomeComponent,
    UnitComponent,
    ChevronRightComponent,
    AdminComponent,
    ClinicsAdminComponent,
    UnitsAdminComponent,
    DeleteModalComponent,
    UsersAdminComponent,
    UnitsAdminFormComponent,
    CalloutComponent,
    CalloutDirective,
    BedFormComponent,
    RowComponent,
    LeftColumnComponent,
    MenuComponent,
    MenuTitleRowComponent,
    RightColumnComponent,
    LoginModalComponent,
    EditMessagesComponent,
    MessageComponent,
    EditMessageComponent
  ],
  imports: [
    BrowserModule,
    NoopAnimationsModule,
    HttpClientModule,
    JwtModule,
    KomponentkartanModule,
    FormsModule,
    ReactiveFormsModule,
    DragulaModule.forRoot(),
    AppRoutingModule,
    AngularFontAwesomeModule,
    CKEditorModule
  ],
  entryComponents: [
    CalloutComponent
  ],
  providers: [
    AuthService,
    AdminGuard,
    UserLoggedInGuard,
    HasEditUnitPermissionGuard,
    {provide: HTTP_INTERCEPTORS, useClass: JwtHttpInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
