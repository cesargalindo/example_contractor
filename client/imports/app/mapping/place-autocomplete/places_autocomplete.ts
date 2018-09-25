import { Component, EventEmitter, NgZone, OnInit, Input, Output,  ElementRef, ViewChild } from '@angular/core';
import { FormControl } from "@angular/forms";
import { LocationTrackingService } from '../../services-global/LocationTrackingService';

import template from './places_autocomplete.html';

@Component({
  selector: 'places-autocomplete',
  inputs:['contextID', 'persist'],
  template
})
export class PlacesAutocompleteComponent implements Component, OnInit {
  @ViewChild("search") public searchElementRef: ElementRef;
  // @ViewChild("searchHistory") public searchHistoryRef: ElementRef;

  @Output() onSearchComplete = new EventEmitter();

  public searchControl: FormControl;
  public contextID:string;
  public persist:boolean = true;

  private contextId: string;
  private persistCustomLocation: boolean;
  private apiStatus: any;

  private locationHistory: any;
  private placeholder: string;


  constructor(
      public _ngZone: NgZone,
      public _locationTrackingService: LocationTrackingService) {
        this.contextId = this.contextID;
        this.persistCustomLocation = this.persist;
      }


    ngOnInit() {
        this.searchControl = new FormControl();
        this.locationHistory = this._locationTrackingService.getSearchHistory().filter(x => x.lastUserQuery.searchQuery !== undefined && x.lastUserQuery.searchQuery.length > 0)

        let xloc = this._locationTrackingService.getLocation();
        if (xloc.customPosition.address == undefined) {
            this.placeholder = "Search For Location";
        }
        else {
            this.placeholder = xloc.customPosition.address;
        }

        this.apiStatus = this._locationTrackingService.getGoogleApiStatus();
        this.apiStatus.subscribe(isReady => {
            if (isReady) {
                let ac2 = new google.maps.places.Autocomplete(this.searchElementRef.nativeElement);

                ac2.addListener("place_changed", () => {
                this._ngZone.run(() => {
                        let search_text:string = "";

                        if (this.searchElementRef.nativeElement.value === undefined || this.searchElementRef.nativeElement.value === null) {
                            console.warn("PAC 32: Could not get value from input field.")
                        }
                        else {
                            search_text = this.searchElementRef.nativeElement.value;
                        }

                        let place = ac2.getPlace();
                        if (place.geometry === undefined || place.geometry === null) {
                            console.warn("PAC 41: No results found for places search.")
                            return;
                        }

                        let searchResults = {
                            address: place.formatted_address,
                            latitude: place.geometry.location.lat(),
                            longitude: place.geometry.location.lng(),
                            accuracy: 10
                        }

                        let searchCriteria = {
                            searchType: "places_ac2",
                            searchQuery: search_text,
                            componentSource: this.contextId
                        }

                        let resultsObj = {criteria: searchCriteria, results: searchResults};
                        console.log(JSON.stringify(resultsObj));
                        this._locationTrackingService.setCustomPosition(searchResults, this.persistCustomLocation, searchCriteria);

                        console.log("PAC 73: Position updated. Calling onSearchComplete")
                        this.onSearchComplete.emit(resultsObj);
                  });
                });
            }
        });
    }



}


