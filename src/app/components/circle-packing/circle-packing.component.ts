import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { Country } from '../../models/country.interface';

@Component({
  selector: 'app-circle-packing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './circle-packing.component.html',
  styleUrls: ['./circle-packing.component.scss']
})
export class CirclePackingComponent implements OnInit, OnDestroy, OnChanges {
  @Input() countries: Country[] = [];
  @Input() sizingCriteria: 'population' | 'land_area_km2' = 'population';
  @Output() countrySelected = new EventEmitter<Country>();

  private svg: any;
  private width = 800;
  private height = 600;
  private simulation: any;
  private resizeObserver: ResizeObserver | null = null;

  // Color scale for regions
  private colorScale = d3.scaleOrdinal()
    .range(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']);

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.initializeVisualization();
    this.setupResizeObserver();
  }

  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['countries'] || changes['sizingCriteria']) {
      if (this.svg && this.countries.length > 0) {
        this.updateVisualization();
      }
    }
  }

  /**
   * Initialize the D3.js visualization
   */
  private initializeVisualization(): void {
    const container = this.elementRef.nativeElement.querySelector('.chart-container');
    this.updateDimensions();

    // Clear any existing SVG
    d3.select(container).selectAll('*').remove();

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('background', 'transparent');

    // Add gradient definitions
    this.createGradients();

    if (this.countries.length > 0) {
      this.updateVisualization();
    }
  }

  /**
   * Create gradient definitions for the circles
   */
  private createGradients(): void {
    const defs = this.svg.append('defs');

    // Create a gradient for each region
    const regions = [...new Set(this.countries.map(c => c.region))];
    
    regions.forEach((region, index) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${region.replace(/\s+/g, '-')}`)
        .attr('cx', '30%')
        .attr('cy', '30%');

      const baseColor = this.colorScale(region);
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d3.color(baseColor as string)?.brighter(0.5).toString() || baseColor);

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', baseColor);
    });
  }

  /**
   * Prepare hierarchical data for circle packing
   */
  private prepareHierarchicalData(): any {
    // Group countries by region
    const regionGroups = d3.group(this.countries, d => d.region);
    
    // Create hierarchical structure
    const children = Array.from(regionGroups, ([regionName, countries]) => ({
      name: regionName,
      children: countries.map(country => ({
        ...country,
        value: country[this.sizingCriteria]
      }))
    }));

    const hierarchyData = {
      name: 'Europe',
      children: children
    };

    return d3.hierarchy(hierarchyData)
      .sum((d: any) => d.value || 0)
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
  }

  /**
   * Update the visualization with current data and criteria
   */
  private updateVisualization(): void {
    if (!this.svg || this.countries.length === 0) return;

    // Stop existing simulation
    if (this.simulation) {
      this.simulation.stop();
    }

    // Prepare hierarchical data for circle packing
    const hierarchyData = this.prepareHierarchicalData();

    // Clear existing elements
    this.svg.selectAll('*').remove();
    this.createGradients();

    // Create the hierarchical circle packing layout
    const isMobile = this.width < 768;
    const padding = isMobile ? 2 : 3;
    const margin = isMobile ? 20 : 40;
    
    const pack = d3.pack()
      .size([this.width - margin, this.height - margin])
      .padding(padding);

    const root = pack(hierarchyData);

    // Create group for all elements
    const groupMargin = isMobile ? 10 : 20;
    const g = this.svg.append('g')
      .attr('transform', `translate(${groupMargin},${groupMargin})`);

    // Create region circles (parent circles)
    const regionCircles = g.selectAll('.region-circle')
      .data(root.children || [])
      .enter()
      .append('circle')
      .attr('class', 'region-circle')
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('r', (d: any) => d.r)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => this.colorScale(d.data.name))
      .attr('stroke-width', 3)
      .style('opacity', 0.7);

    // Create country circles (child circles)
    const countryCircles = g.selectAll('.country-circle')
      .data(root.descendants().filter((d: any) => d.depth === 2))
      .enter()
      .append('circle')
      .attr('class', 'country-circle')
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y)
      .attr('r', (d: any) => d.r)
      .attr('fill', (d: any) => `url(#gradient-${d.parent.data.name.replace(/\s+/g, '-')})`)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('opacity', 0);

    // Add region labels
    const regionLabels = g.selectAll('.region-label')
      .data(root.children || [])
      .enter()
      .append('text')
      .attr('class', 'region-label')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y - d.r + (isMobile ? 15 : 20))
      .attr('text-anchor', 'middle')
      .style('font-size', isMobile ? '12px' : '14px')
      .style('font-weight', '600')
      .style('fill', (d: any) => this.colorScale(d.data.name))
      .text((d: any) => d.data.name)
      .style('opacity', 0);

    // Add country labels (adjust threshold for mobile)
    const labelThreshold = isMobile ? 15 : 20;
    const countryLabels = g.selectAll('.country-label')
      .data(root.descendants().filter((d: any) => d.depth === 2 && d.r > labelThreshold))
      .enter()
      .append('text')
      .attr('class', 'country-label')
      .attr('x', (d: any) => d.x)
      .attr('y', (d: any) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .style('font-size', (d: any) => Math.min(d.r / (isMobile ? 4 : 3), isMobile ? 10 : 12) + 'px')
      .style('font-weight', '600')
      .style('fill', '#fff')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.7)')
      .style('pointer-events', 'none')
      .text((d: any) => d.data.country)
      .style('opacity', 0);

    // Add interactions
    countryCircles
      .on('mouseover', function(this: SVGCircleElement, event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'drop-shadow(0 5px 15px rgba(0,0,0,0.3))')
          .attr('r', d.r * 1.1);
      })
      .on('mouseout', function(this: SVGCircleElement, event: any, d: any) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('filter', 'none')
          .attr('r', d.r);
      })
      .on('click', (event: any, d: any) => {
        this.countrySelected.emit(d.data as Country);
      });

    // Animate entrance
    regionCircles
      .transition()
      .duration(800)
      .style('opacity', 0.7);

    regionLabels
      .transition()
      .duration(800)
      .delay(200)
      .style('opacity', 1);

    countryCircles
      .transition()
      .duration(800)
      .delay((_d: any, i: number) => 400 + i * 30)
      .style('opacity', 1);

    countryLabels
      .transition()
      .duration(800)
      .delay((_d: any, i: number) => 600 + i * 30)
      .style('opacity', 1);

    // Add legend
    this.addRegionLegend();
  }

  /**
   * Prepare data for visualization (legacy method)
   */
  private prepareData(): any[] {
    const maxValue = d3.max(this.countries, d => d[this.sizingCriteria]) || 1;
    const minValue = d3.min(this.countries, d => d[this.sizingCriteria]) || 0;
    
    // Scale for radius (minimum 15px, maximum 60px)
    const radiusScale = d3.scaleSqrt()
      .domain([minValue, maxValue])
      .range([15, 60]);

    return this.countries.map(country => ({
      ...country,
      radius: radiusScale(country[this.sizingCriteria]),
      x: Math.random() * this.width,
      y: Math.random() * this.height
    }));
  }

  /**
   * Add region legend
   */
  private addRegionLegend(): void {
    const regions = [...new Set(this.countries.map(c => c.region))];
    const legend = this.svg.selectAll('.legend').data([null]).enter()
      .append('g')
      .attr('class', 'legend');

    const legendItems = legend.selectAll('.legend-item')
      .data(regions)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d: any, i: number) => `translate(20, ${20 + i * 25})`);

    legendItems.append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => this.colorScale(d));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('fill', '#fff')
      .style('font-weight', '500')
      .text((d: any) => d);
  }

  /**
   * Update dimensions based on container size
   */
  private updateDimensions(): void {
    const container = this.elementRef.nativeElement.querySelector('.chart-container');
    if (container) {
      this.width = container.clientWidth;
      this.height = container.clientHeight;
      
      // Ensure minimum dimensions for mobile
      this.width = Math.max(this.width, 320);
      this.height = Math.max(this.height, 300);
    }
  }

  /**
   * Setup resize observer to handle responsive behavior
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateDimensions();
        if (this.svg) {
          this.svg.attr('width', this.width).attr('height', this.height);
          if (this.simulation) {
            this.simulation.force('center', d3.forceCenter(this.width / 2, this.height / 2));
            this.simulation.alpha(0.3).restart();
          }
        }
      });

      const container = this.elementRef.nativeElement.querySelector('.chart-container');
      if (container) {
        this.resizeObserver.observe(container);
      }
    }
  }
}
