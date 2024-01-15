import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./chart/chart.component').then((mod) => mod.ChartComponent),
  },
];
