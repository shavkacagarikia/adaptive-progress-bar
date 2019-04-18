import { Component, OnInit, ElementRef, ViewChildren, QueryList, ChangeDetectorRef, Input } from '@angular/core';
import { Subject, BehaviorSubject, Subscription } from 'rxjs';
import { ProgressBarConfig } from '../../ProgressBarConfig';

class Partition {
  value: number;
  widthToThis: number;
  isChecked: boolean;
}

class ReversePartition {
  value: number;
  positionFromLeft: number;
  isChecked: boolean;
}

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss']
})
export class ProgressBarComponent implements OnInit {

  @Input() progressBarConfig$: BehaviorSubject<any> = new BehaviorSubject(undefined);
  @ViewChildren('partitionItems') partitionItems: QueryList<ElementRef>;
  @ViewChildren('reversedPartitionItems') reversedPartitionItems: QueryList<ElementRef>;

  partitions: Array<Partition> = [];

  reversePartitions: Array<ReversePartition> = [];

  valArr: Array<number> = [];

  progressBarConfig: ProgressBarConfig = {
    minValue: 0,
    maxValue: 0,
    progress: 0,
    inputPartitions: [],
    isCheckable: false,
    isAdaptationReversed: false,
    isAnimated: true
  };

  partitionsTotalWidthPercentage: number = 0;
  singleItemWidthPercentage: number = 0;

  isDataReady: boolean = false;

  subs: Subscription;

  public isCheckable: boolean = false;

  isAdaptationReversed: boolean = false;

  public width: number;
  constructor(
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit() {
    this.subs = this.progressBarConfig$.subscribe(progressConfig => {
      if (progressConfig) {
        this.progressBarConfig = progressConfig;
        this.isCheckable = this.progressBarConfig.isCheckable;
        this.isAdaptationReversed = this.progressBarConfig.isAdaptationReversed;
        this.partitions = [];
        this.reversePartitions = [];
        this.valArr = [];
        this.width = this.getProgressBarWidth();
        this.isDataReady = true;
        if (progressConfig.inputPartitions) {
          this.InitProgress();
        } else {
          this.reversePartitions = [];
          this.partitions = [];
          this.valArr = [];
        }
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  InitProgress() {
    if (!this.IsMobileRes()) {
      this.progressBarConfig.inputPartitions.sort((a, b) => a - b);
      if (!this.isAdaptationReversed) {
        for (let index = 0; index < this.progressBarConfig.inputPartitions.length; index++) {
          this.partitions.push({ value: this.progressBarConfig.inputPartitions[index], widthToThis: 0, isChecked: false });
          this.valArr.push(this.partitions[index].value);
        }
      } else {
        for (let index = 0; index < this.progressBarConfig.inputPartitions.length; index++) {
          this.reversePartitions.push({ value: this.progressBarConfig.inputPartitions[index], positionFromLeft: 0, isChecked: false });
          this.valArr.push(this.reversePartitions[index].value);
        }
      }
    }
  }

  public getProgressBarWidth(): number {

    if (!this.progressBarConfig.maxValue || this.progressBarConfig.progress == 0) {
      return 0;
    } else {
      return (this.progressBarConfig.progress * 100) / this.progressBarConfig.maxValue;
    }
  }

  ngAfterViewInit() {
    this.handlePartitions();
    this.partitionItems.changes.subscribe(val => {
      if (!this.isAdaptationReversed) {
        this.handlePartitions();
      }
    });
    this.reversedPartitionItems.changes.subscribe(val => {
      if (this.isAdaptationReversed) {
        this.handlePartitions();
      }
    });
  }


  handlePartitions() {
    if (!this.IsMobileRes() && this.progressBarConfig.inputPartitions) {
      if (!this.isAdaptationReversed) {
        this.singleItemWidthPercentage = this.progressBarConfig.maxValue / this.partitions.length;
        this.partitionsTotalWidthPercentage = this.singleItemWidthPercentage * this.partitions.length;
        this.placePartitions();
        this.calculateProgressPosition();
      } else {
        this.placeReversePartitions();
      }
    }
  }

  placeReversePartitions() {
    this.reversedPartitionItems.forEach((el, index) => {

      const obj: ReversePartition = this.reversePartitions[index];
      obj.positionFromLeft = (obj.value / this.progressBarConfig.maxValue) * 100;
      if (this.progressBarConfig.progress >= obj.value) {
        obj.isChecked = true;
      }
      const element: HTMLElement = el.nativeElement as HTMLElement;
      element.style.left = 'calc(' + obj.positionFromLeft.toString() + '% - 12px)';
    });
    this.cdr.detectChanges();
  }

  placePartitions() {
    const partWidth = (this.singleItemWidthPercentage / (this.progressBarConfig.maxValue)) * 100;
    this.partitionItems.forEach((el, index) => {
      const obj: Partition = this.partitions[index];
      obj.widthToThis = 0;
      for (let i = index; i >= 0; i--) {
        obj.widthToThis += partWidth;
      }
      const element: HTMLElement = el.nativeElement as HTMLElement;
      if (this.progressBarConfig.maxValue > 100) {
        element.style.width = this.singleItemWidthPercentage.toString() + '%';
      } else if (this.progressBarConfig.maxValue > 10 && this.progressBarConfig.maxValue <= 100) {
        element.style.width = (this.singleItemWidthPercentage * 10).toString() + '%';
      } else if (this.progressBarConfig.maxValue <= 10) {
        element.style.width = (this.singleItemWidthPercentage * 100).toString() + '%';
      }

    });
  }

  calculateProgressPosition() {
    let closestElement = this.closestElementInArray(this.valArr, this.progressBarConfig.progress);
    if (!closestElement || !isFinite(closestElement)) {
      closestElement = 0;
    }
    const localProgress = this.progressBarConfig.progress - closestElement;
    const index = this.valArr.indexOf(closestElement);

    let localNext = this.valArr[index + 1];
    if (!localNext) {
      localNext = this.progressBarConfig.maxValue;
    }
    const sub = localNext - closestElement;
    const localProgressPercentage = (localProgress * 100) / sub;
    const minusVal = (((this.singleItemWidthPercentage / 2) * 100) / this.partitionsTotalWidthPercentage);
    const plusVal = (((localProgressPercentage * this.singleItemWidthPercentage) / this.partitionsTotalWidthPercentage));
    if (index == -1) {
      this.width = (plusVal / 2);
    } else if (localNext == this.progressBarConfig.maxValue) {
      this.width = this.partitions[index].widthToThis - minusVal + (plusVal / 2);
    } else {
      this.width = this.partitions[index].widthToThis - minusVal + plusVal;
    }
    this.partitions.forEach(val => {
      if (val.value <= closestElement) {
        val.isChecked = true;
      }
    });
    this.cdr.detectChanges();
  }

  IsMobileRes() {
    return document.body.clientWidth < 575 ? true : false;
  }

  closestElementInArray(arr, val) {
    return Math.max.apply(null, arr.filter(v => v <= val));
  }



}
