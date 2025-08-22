import { promises as fs } from 'fs';
import { join } from 'path';
import { MockDataConfiguration, DEFAULT_MOCK_DATA } from '@shared/data-types';
import { DataTransformer } from './data-transformer';

export class DataLoader {
  private mockData: MockDataConfiguration;
  private extendedData: any; // For ML features
  private dataPath: string;

  constructor(dataPath: string = join(process.cwd(), 'mock-data.json')) {
    this.dataPath = dataPath;
    this.mockData = DEFAULT_MOCK_DATA;
    this.extendedData = null;
  }

  async loadData(): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.dataPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      // Check if this is the new external format or the old internal format
      if (jsonData.customers && jsonData.customers[0] && 'signup_date' in jsonData.customers[0]) {
        // New external format - transform it
        this.mockData = DataTransformer.transformToInternal(jsonData);
        this.extendedData = DataTransformer.getExtendedData(jsonData);
        console.log(`✅ External mock data loaded and transformed from ${this.dataPath}`);
      } else {
        // Old internal format - validate and merge
        this.mockData = this.validateAndMergeData(jsonData as MockDataConfiguration);
        console.log(`✅ Internal mock data loaded from ${this.dataPath}`);
      }
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        console.log(`ℹ️  No mock data file found at ${this.dataPath}, using default data`);
      } else {
        console.warn(`⚠️  Error loading mock data from ${this.dataPath}:`, (error as any).message);
        console.log('📦 Falling back to default mock data');
      }
      // Use default data on any error
      this.mockData = DEFAULT_MOCK_DATA;
      this.extendedData = null;
    }
  }

  private validateAndMergeData(jsonData: Partial<MockDataConfiguration>): MockDataConfiguration {
    // Merge with defaults to ensure all required fields are present
    return {
      customers: jsonData.customers || DEFAULT_MOCK_DATA.customers,
      churnCauses: jsonData.churnCauses || DEFAULT_MOCK_DATA.churnCauses,
      interventions: jsonData.interventions || DEFAULT_MOCK_DATA.interventions,
      integrations: (jsonData as any).integrations || DEFAULT_MOCK_DATA.integrations,
  
      riskAlerts: jsonData.riskAlerts || DEFAULT_MOCK_DATA.riskAlerts,
      dashboardSettings: {
        ...DEFAULT_MOCK_DATA.dashboardSettings,
        ...jsonData.dashboardSettings,
      },
      chartData: {
        ...DEFAULT_MOCK_DATA.chartData,
        ...jsonData.chartData,
      },
    };
  }

  getMockData(): MockDataConfiguration {
    return this.mockData;
  }

  async reloadData(): Promise<void> {
    await this.loadData();
  }

  async saveData(data: MockDataConfiguration): Promise<void> {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2), 'utf-8');
      this.mockData = data;
      console.log(`✅ Mock data saved to ${this.dataPath}`);
    } catch (error) {
      console.error(`❌ Error saving mock data to ${this.dataPath}:`, (error as any).message);
      throw error;
    }
  }

  // Convenience methods for getting specific data types
  getCustomers() {
    return this.mockData.customers;
  }

  getChurnCauses() {
    return this.mockData.churnCauses;
  }

  getInterventions() {
    return this.mockData.interventions;
  }



  getRiskAlerts() {
    return this.mockData.riskAlerts;
  }

  getDashboardSettings() {
    return this.mockData.dashboardSettings;
  }

  getChartData() {
    return this.mockData.chartData;
  }

  getExtendedData() {
    return this.extendedData;
  }
}

// Singleton instance
export const dataLoader = new DataLoader();