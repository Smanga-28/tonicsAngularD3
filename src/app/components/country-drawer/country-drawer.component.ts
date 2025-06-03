import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Country } from '../../models/country.interface';

@Component({
  selector: 'app-country-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './country-drawer.component.html',
  styleUrls: ['./country-drawer.component.scss']
})
export class CountryDrawerComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() country: Country | null = null;
  @Output() closed = new EventEmitter<void>();

  // Flag to handle image loading errors
  flagImageError = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['country'] && this.country) {
      // Reset flag error state when country changes
      this.flagImageError = false;
    }
  }

  /**
   * Close the drawer
   */
  closeDrawer(): void {
    this.closed.emit();
  }

  /**
   * Handle flag image loading error
   */
  onFlagImageError(): void {
    this.flagImageError = true;
  }

  /**
   * Format large numbers with commas
   */
  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  /**
   * Open Wikipedia link in new tab
   */
  openWikipedia(): void {
    if (this.country?.wikipedia) {
      window.open(this.country.wikipedia, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Calculate population density
   */
  getPopulationDensity(): number {
    if (this.country?.population && this.country?.land_area_km2) {
      return Math.round(this.country.population / this.country.land_area_km2);
    }
    return 0;
  }

  /**
   * Get country size category based on land area
   */
  getSizeCategory(): string {
    if (!this.country?.land_area_km2) return 'Unknown';
    
    const area = this.country.land_area_km2;
    if (area > 500000) return 'Very Large';
    if (area > 100000) return 'Large';
    if (area > 50000) return 'Medium';
    if (area > 10000) return 'Small';
    return 'Very Small';
  }

  /**
   * Get population category
   */
  getPopulationCategory(): string {
    if (!this.country?.population) return 'Unknown';
    
    const pop = this.country.population;
    if (pop > 50000000) return 'Very High';
    if (pop > 10000000) return 'High';
    if (pop > 5000000) return 'Medium';
    if (pop > 1000000) return 'Low';
    return 'Very Low';
  }
}
