import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  signal,
} from '@angular/core';
import Chart, {
  ChartType,
  Tooltip,
  TooltipPositionerFunction,
} from 'chart.js/auto';
import { TokenPriceApiService } from '../core/apis/token-price-api.service';
import { TokenApiService } from '../core/apis/token-api.service';
import { CommonModule } from '@angular/common';

declare module 'chart.js' {
  interface TooltipPositionerMap {
    hypraChartTooltipPositioner: TooltipPositionerFunction<ChartType>;
  }
}

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements AfterViewInit {
  // Width of the chart bars
  public barWidth = 15;
  // Market cap of the token
  public marketCap = signal(0);
  // Total supply of the token
  public totalSupply = signal(0);
  // Tokens owned by the user
  public yourTokens = signal(0);
  // Current money in USD of the user
  public money = signal(0);
  // Price change in the last 24 hours
  public change = signal(0);
  // Current price in USD of the token
  public currentPrice = signal(0);
  // Chart instance
  public chart: any;
  // DOM Chart container's element
  @ViewChild('chartContainer') public chartContainer!: ElementRef;

  public constructor(
    private tokenApi: TokenApiService,
    private tokenPriceApi: TokenPriceApiService
  ) {}

  /**
   * Method used to refresh the market cap
   */
  public refreshMarketCap() {
    this.marketCap.set(this.currentPrice() * this.totalSupply());
  }

  /**
   * Method called when the user click on the add tokens button
   */
  public addTokens() {
    const tokens = prompt('Enter your tokens amount');
    if (tokens) {
      this.yourTokens.set(Number(tokens));
      this.money.set(this.currentPrice() * Number(tokens));
    }
  }

  /**
   * Method called when the view is initialized
   */
  public ngAfterViewInit() {
    // Getting token details
    this.tokenApi
      .getToken('0xCf52025D37f68dEdA9ef8307Ba4474eCbf15C33c')
      .subscribe((data: any) => {
        this.totalSupply.set(data.total_supply);
        this.refreshMarketCap();
      });
    Tooltip.positioners.hypraChartTooltipPositioner = (_, eventPosition) => {
      return {
        x: eventPosition.x,
        y:
          this.chartContainer.nativeElement.getBoundingClientRect().bottom -
          100,
      };
    };
    this.refresh();
    // Refreshing every 10 seconds the chart
    setInterval(() => {
      this.refresh();
    }, 10000);
  }

  /**
   * Method used to refresh the chart data
   */
  public refresh() {
    this.tokenPriceApi
      .getPrices('0xCf52025D37f68dEdA9ef8307Ba4474eCbf15C33c')
      .subscribe((data: any) => {
        this.setData(data);
      });
  }

  /**
   * Method used to set the data in the chart
   * @param data Data to set in the chart
   */
  public setData(data: any[]) {
    this.chartContainer.nativeElement.style.width =
      data.length * this.barWidth + 'px';
    this.currentPrice.set(data[data.length - 1].price / Math.pow(10, 18));
    // Searching for the last price in the last 24 hours
    let h24Price = data.find((val: any) => {
      const date = new Date(val.created_at);
      const now = new Date();
      return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
    });
    // If there is no price in the last 24 hours, we take the first price
    if (!h24Price) {
      h24Price = data[0];
    }
    // We divide by 10^18 to get the decimal value
    const lastPrice = data[data.length - 1].price / Math.pow(10, 18);
    // We divide by 10^18 to get the decimal value
    const h24PriceValue = h24Price.price / Math.pow(10, 18);
    const diff = lastPrice - h24PriceValue;
    const percent = (diff / h24PriceValue) * 100;
    this.change.set(percent);
    this.refreshMarketCap();
    const labels = data.map((val: any) => val.created_at);
    const values = data.map((val: any) => {
      // We divide by 10^18 to get the decimal value
      const value = val.price / Math.pow(10, 18);
      return value;
    });
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = values;
      this.chart.update();
    } else {
      this.createChart(labels, values);
    }
  }

  /**
   * Method used to draw the chart bars (candlestick chart)
   * @param chart Chart instance to draw
   */
  public draw(chart: any) {
    const ctx = chart.ctx;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    chart.data.datasets.forEach(function (dataset: any, i: any) {
      const meta = chart.getDatasetMeta(i);
      let lastData: number | undefined = undefined;
      let lastTop: number | undefined = undefined;
      meta.data.forEach(function (bar: any, index: any) {
        const data = Number(dataset.data[index]);
        // If price is higher than last price, we draw a green bar
        if (!lastData || data > lastData) {
          ctx.fillStyle = 'rgb(40,164,156)';
        }
        // If price is lower than last price, we draw a red bar
        else {
          ctx.fillStyle = 'rgb(240,84,84)';
        }
        const yTop = bar.getProps(['y'], true).y;
        const barHeight = 20;
        const newYTop = yTop - barHeight / 2;
        // Draw the bar
        ctx.fillRect(
          bar.x - bar.width / 2,
          lastTop ?? newYTop - barHeight / 1.5,
          bar.width - 2,
          // Setting green bar height depending on the difference between last price and current price
          !lastData || data > lastData
            ? Math.min(
                barHeight,
                lastTop ? newYTop - lastTop + barHeight / 1.5 : 0
              )
            : Math.max(
                barHeight,
                lastTop ? newYTop - lastTop + barHeight / 1.5 : 0
              )
        );
        lastTop = newYTop;
        lastData = data;
      });
    });
  }

  /**
   * Method used to create the chart
   * @param labels Labels for the chart
   * @param values Values for the chart
   */
  public createChart(labels: any[], values: any[]) {
    const that = this;
    this.chart = new Chart('hypraChart', {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Price',
            data: values,
            backgroundColor: 'transparent',
            barThickness: this.barWidth,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              title: function (context: any) {
                return new Date(context[0].label).toLocaleString();
              },
              label: function (context) {
                let value = context.raw;
                return Number(value).toFixed(8) + '$';
              },
              footer: function (context: any) {
                const value = context[0].raw;
                const lastValue =
                  context[0].dataset.data[context[0].dataIndex - 1];
                const diff = Number(value) - Number(lastValue);
                const percent = (diff / Number(lastValue)) * 100;
                return (
                  (percent > 0 ? '+' : '') +
                  percent.toFixed(2) +
                  '% (' +
                  diff.toFixed(8) +
                  '$)'
                );
              },
            },
            position: 'hypraChartTooltipPositioner',
          },
        },
        animation: {
          onComplete: function (event) {
            that.draw(that.chart);
          },
          onProgress: function () {
            that.draw(that.chart);
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function (value: any, index: any, values: any) {
                return Number(value).toFixed(8);
              },
            },
            position: 'right',
          },
          x: {
            ticks: {
              callback: function (value: any, index: any, values: any) {
                return new Date(this.getLabels()[value]).toLocaleString();
              },
            },
          },
        },
      },
    });
  }
}
