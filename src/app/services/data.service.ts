import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataUrl = 'assets/data/europe_population_enriched.json';

  constructor(private http: HttpClient) { }

  /**
   * Fetch countries data from JSON file
   * Returns observable with the raw data structure
   */
  getCountriesData(): Observable<any> {
    return this.http.get<any>(this.dataUrl).pipe(
      map(data => {
        // Validate data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data format: Expected object structure');
        }

        // Basic validation to ensure we have the expected structure
        const hasValidStructure = Object.keys(data).some(continentKey => {
          const continent = data[continentKey];
          return continent && typeof continent === 'object' && 
                 Object.keys(continent).some(regionKey => {
                   const countries = continent[regionKey];
                   return Array.isArray(countries) && countries.length > 0;
                 });
        });

        if (!hasValidStructure) {
          throw new Error('Invalid data format: Expected continent->region->countries structure');
        }

        return data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned unsuccessful response code
      switch (error.status) {
        case 404:
          errorMessage = 'Data file not found. Please ensure the dataset is properly configured.';
          break;
        case 500:
          errorMessage = 'Server error occurred while loading data.';
          break;
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        default:
          errorMessage = `Error loading data: ${error.status} - ${error.message}`;
      }
    }

    console.error('DataService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
