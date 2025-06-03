import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { CirclePackingComponent } from './components/circle-packing/circle-packing.component';
import { CountryDrawerComponent } from './components/country-drawer/country-drawer.component';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [
    AppComponent,
    CirclePackingComponent,
    CountryDrawerComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule
  ],
  providers: [
    DataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
