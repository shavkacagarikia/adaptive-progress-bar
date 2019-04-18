import { Component, ElementRef, ViewChild } from '@angular/core';
import { ProgressBarConfig } from '../ProgressBarConfig';
import { BehaviorSubject } from 'rxjs';
import { formArrayNameProvider } from '@angular/forms/src/directives/reactive_directives/form_group_name';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'adaptive-progress-bar';

  @ViewChild('form') form: ElementRef;
  @ViewChild('sim') sim: ElementRef;

  defaultProgressBarConfig: ProgressBarConfig = {
    minValue: 0,
    maxValue: 550,
    progress: 120,
    inputPartitions: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500],
    isCheckable: false,
    isAdaptationReversed: false,
    isAnimated: true
  };

  progressBarConfig: ProgressBarConfig = new ProgressBarConfig();
  public progressBarConfig$: BehaviorSubject<any> = new BehaviorSubject(undefined);

  ngOnInit() {
    this.InitDefault();
  }

  InitDefault() {
    this.progressBarConfig = JSON.parse(JSON.stringify(this.defaultProgressBarConfig));
    this.progressBarConfig$.next(this.progressBarConfig);
  }

  // testtttttttttttt
  prevent = false;

  random() {
    if (!this.prevent) {
      this.prevent = true;
      this.progressBarConfig.isAnimated = true;
      this.progressBarConfig.maxValue = Math.floor(Math.random() * 20000);
      this.progressBarConfig.progress = Math.floor(Math.random() * this.progressBarConfig.maxValue);
      this.progressBarConfig.inputPartitions.length = Math.floor(Math.random() * 15);
      for (let index = 0; index < this.progressBarConfig.inputPartitions.length; index++) {
        const nu = this.gen();

        this.progressBarConfig.inputPartitions[index] = nu;
      }
      this.progressBarConfig$.next(this.progressBarConfig);
      this.prevent = false;
    }
  }
  gen(): number {
    const element: number = Math.floor(Math.random() * this.progressBarConfig.maxValue);
    let found: boolean = false;
    this.progressBarConfig.inputPartitions.forEach(val => {
      if (element == val || element == 0 || element == this.progressBarConfig.maxValue) {
        found = true;
      }
    });
    if (found) {
      this.gen();
    }
    return element;
  }

  generate() {
    if (!this.prevent) {

      const el: HTMLElement = (this.form.nativeElement as HTMLElement);
      const tempProgressBarConfig: ProgressBarConfig = this.progressBarConfig;
      tempProgressBarConfig.isAnimated = true;
      for (let index = 0; index < el.children.length; index++) {
        const element = el.children[index];
        const input: HTMLInputElement = element.children[0] as HTMLInputElement;
        if (input.value != undefined) {
          if (element.classList.contains('checkable')) {

            tempProgressBarConfig[element.id] = input.checked;
          } else if (element.classList.contains('array')) {
            if (input.value) {
              let arr = input.value.split(',').map((item) => {
                return parseFloat(item);
              });
              const hasNan: boolean = arr.some(value => {
                return isNaN(value);
              });
              if (hasNan) {
                arr = [];
              }

              tempProgressBarConfig[element.id] = arr;
            }
          } else {
            if (input.value) {
              tempProgressBarConfig[element.id] = parseFloat(input.value);
            }
          }
        }


      }
      this.progressBarConfig$.next(tempProgressBarConfig);
      console.log(tempProgressBarConfig);
    }
  }
  interval = null;
  simulate() {
    this.prevent = true;
    const fromEl: HTMLElement = document.getElementById('from');
    const toEl: HTMLElement = document.getElementById('to');
    const durationEl: HTMLElement = document.getElementById('duration');
    let from: number = parseFloat((fromEl.children[0] as HTMLInputElement).value);
    let to: number = parseFloat((toEl.children[0] as HTMLInputElement).value);
    let duration: number = parseFloat((durationEl.children[0] as HTMLInputElement).value);
    if (!from) {
      from = 0;
    }
    if (!to) {
      to = 120;
    }
    if (!duration) {
      duration = 5;
    }
    const tempProgressBarConfig: ProgressBarConfig = this.progressBarConfig;
    tempProgressBarConfig.isAnimated = false;
    tempProgressBarConfig.progress = from;
    this.progressBarConfig$.next(tempProgressBarConfig);
    setTimeout(() => {
      this.interval = setInterval(() => {
        tempProgressBarConfig.progress += 1;
        this.progressBarConfig$.next(tempProgressBarConfig);
        if (tempProgressBarConfig.progress == to) {
          clearInterval(this.interval);
          this.prevent = false;
        }
      }, (duration / to) * 1000);
    }, 1000);

  }
  default() {
    this.InitDefault();
  }
}
