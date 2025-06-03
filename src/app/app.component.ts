import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from './services/data.service';
import { Country } from './models/country.interface';
import { CirclePackingComponent } from './components/circle-packing/circle-packing.component';
import { CountryDrawerComponent } from './components/country-drawer/country-drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CirclePackingComponent, CountryDrawerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [DataService]
})
export class AppComponent implements OnInit {
  title = 'European Countries Circle Packing Visualization';
  
  // State for the application
  countries: Country[] = [];
  selectedCountry: Country | null = null;
  isDrawerOpen = false;
  sizingCriteria: 'population' | 'land_area_km2' = 'population';
  isLoading = true;
  error: string | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Load country data from the data service
   */
  private loadData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.dataService.getCountriesData().subscribe({
      next: (data) => {
        this.countries = this.flattenCountriesData(data);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load country data. Please try again later.';
        this.isLoading = false;
        console.error('Error loading data:', err);
      }
    });
  }

  /**
   * Flatten the nested region structure into a simple array of countries
   * Each country will have its region information attached
   */
  private flattenCountriesData(data: any): Country[] {
    const countries: Country[] = [];
    
    for (const continentKey in data) {
      const continent = data[continentKey];
      for (const regionKey in continent) {
        const regionCountries = continent[regionKey];
        regionCountries.forEach((country: any) => {
          countries.push({
            ...country,
            continent: continentKey,
            region: regionKey
          });
        });
      }
    }
    
    return countries;
  }

  /**
   * Handle toggle change for sizing criteria
   */
  onSizingCriteriaChange(criteria: 'population' | 'land_area_km2'): void {
    this.sizingCriteria = criteria;
  }

  /**
   * Handle country selection from the visualization
   */
  onCountrySelected(country: Country): void {
    this.selectedCountry = country;
    this.isDrawerOpen = true;
  }

  /**
   * Handle drawer close event
   */
  onDrawerClose(): void {
    this.isDrawerOpen = false;
    this.selectedCountry = null;
  }

  /**
   * Retry loading data in case of error
   */
  retryLoad(): void {
    this.loadData();
  }

  /**
   * Format large numbers with commas
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }
}
