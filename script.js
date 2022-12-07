'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout {
  id = (Date.now() + '').slice(-10); // give it a unique id (e.g , last 10 numbers from the Date)
  date = new Date();
  // clicks = 0;
  constructor(coords, distance, duration) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  // click() {
  //   this.clicks++;
  // }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}
class Cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class Running extends workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];

  // constructor will be triggered when a new app object is created
  constructor() {
    this._getPosition();
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._goToPopUp.bind(this));

    // get local storage workouts
    this._getlocalStorage();
  }

  _getPosition() {
    // we check first if the browser is able to use the geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          //error function
          alert('couldnt find your current location');
        }
      );
    }
  }
  _loadMap(position) {
    // success function
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    this.#map = L.map('map').setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    // // we get data from local storage from here also , so we can have the markers after the map is loaded
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hdieFrom() {
    // clear the inputs
    inputCadence.value = '';
    inputDistance.value = '';
    inputElevation.value = '';
    inputDuration.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 100);
  }
  _toggleElevationField() {
    // when we switch between workout type , we toggle the 'form__row--hidden'
    //if inputCadence does/nt have the 'form__row--hidden', we will remove it or add it
    //if inputElevation does/nt have the 'form__row--hidden', we will remove it or add it
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    e.preventDefault();
    const checkValidation = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const checklAllPositive = (...inputs) => inputs.every(input => input > 0);
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout = '';

    // check if workout us running, creat a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid
      if (
        !checkValidation(distance, duration, cadence) ||
        !checklAllPositive(distance, duration, cadence)
      ) {
        return alert('Data must be positive');
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // check if workout us cycling, creat a cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid

      if (
        !checkValidation(distance, duration, elevation) ||
        !checklAllPositive(distance, duration)
      ) {
        return alert('Data must be positive');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    // add new workout to the workout array
    this.#workouts.push(workout);

    // render the workout on the map
    this._renderWorkoutMarker(workout);

    // render ther workout on list
    this._renderWorkout(workout);

    // hide form
    this._hdieFrom();

    // set local storage to all workouts
    this._setlocalStorage();
  }
  _renderWorkoutMarker(workout) {
    //DISPLAY MRAKER
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃🏾' : '🚲'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    console.log(workout.description);
    let html = `
        <li class="workout ${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">
            ${workout.type === 'running' ? '🏃🏾' : '🚲'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }
    if (workout.type === 'cycling') {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _goToPopUp(e) {
    if (!this.#map) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animated: true,
      pan: { duration: 1 },
    });
    // workout.click();
    console.log(workout);
  }

  _setlocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getlocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
