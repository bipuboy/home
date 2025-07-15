import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface DatabaseCollections {
  tickets: any[];
  users: any[];
  automationRules: any[];
  slaConfigs: any[];
  departments: any[];
  escalationRules: any[];
}

class DatabaseService {
  private dataPath: string;
  private collections: DatabaseCollections;

  constructor() {
    this.dataPath = path.join(__dirname, '../../data');
    this.ensureDataDirectory();
    this.collections = this.loadCollections();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private loadCollections(): DatabaseCollections {
    const collections: DatabaseCollections = {
      tickets: [],
      users: [],
      automationRules: [],
      slaConfigs: [],
      departments: [],
      escalationRules: []
    };

    for (const [collectionName] of Object.entries(collections)) {
      const filePath = path.join(this.dataPath, `${collectionName}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          collections[collectionName as keyof DatabaseCollections] = JSON.parse(data);
        } catch (error) {
          console.error(`Error loading ${collectionName}:`, error);
        }
      }
    }

    return collections;
  }

  private saveCollection(collectionName: keyof DatabaseCollections): void {
    const filePath = path.join(this.dataPath, `${collectionName}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.collections[collectionName], null, 2));
    } catch (error) {
      console.error(`Error saving ${collectionName}:`, error);
    }
  }

  // Generic CRUD operations
  public create<T>(collectionName: keyof DatabaseCollections, data: Omit<T, 'id'>): T {
    const newItem = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    } as T;

    this.collections[collectionName].push(newItem);
    this.saveCollection(collectionName);
    return newItem;
  }

  public findAll<T>(collectionName: keyof DatabaseCollections): T[] {
    return this.collections[collectionName] as T[];
  }

  public findById<T>(collectionName: keyof DatabaseCollections, id: string): T | null {
    const item = this.collections[collectionName].find(item => item.id === id);
    return item || null;
  }

  public findBy<T>(
    collectionName: keyof DatabaseCollections, 
    predicate: (item: T) => boolean
  ): T[] {
    return this.collections[collectionName].filter(predicate) as T[];
  }

  public update<T>(
    collectionName: keyof DatabaseCollections, 
    id: string, 
    updates: Partial<T>
  ): T | null {
    const index = this.collections[collectionName].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.collections[collectionName][index] = {
      ...this.collections[collectionName][index],
      ...updates,
      updatedAt: new Date()
    };

    this.saveCollection(collectionName);
    return this.collections[collectionName][index] as T;
  }

  public delete(collectionName: keyof DatabaseCollections, id: string): boolean {
    const index = this.collections[collectionName].findIndex(item => item.id === id);
    if (index === -1) return false;

    this.collections[collectionName].splice(index, 1);
    this.saveCollection(collectionName);
    return true;
  }

  // Pagination and filtering
  public findWithPagination<T>(
    collectionName: keyof DatabaseCollections,
    options: {
      page: number;
      limit: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      filter?: (item: T) => boolean;
    }
  ): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } {
    let data = this.collections[collectionName] as T[];

    // Apply filter if provided
    if (options.filter) {
      data = data.filter(options.filter);
    }

    // Apply sorting
    if (options.sortBy) {
      data.sort((a: any, b: any) => {
        const aVal = a[options.sortBy!];
        const bVal = b[options.sortBy!];
        
        if (options.sortOrder === 'desc') {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        } else {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
      });
    }

    const total = data.length;
    const totalPages = Math.ceil(total / options.limit);
    const startIndex = (options.page - 1) * options.limit;
    const endIndex = startIndex + options.limit;

    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages
      }
    };
  }

  // Initialize default data
  public initializeDefaultData(): void {
    // Create default admin user if no users exist
    if (this.collections.users.length === 0) {
      this.create('users', {
        email: 'admin@kepsla.com',
        name: 'System Administrator',
        role: 'admin',
        department: 'Administration',
        whatsappNumber: '+1234567890',
        isActive: true,
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
      });
    }

    // Create default departments if none exist
    if (this.collections.departments.length === 0) {
      const departments = [
        'Front Desk',
        'Housekeeping',
        'Food & Beverage',
        'Maintenance',
        'IT Support',
        'Administration'
      ];

      departments.forEach(name => {
        this.create('departments', {
          name,
          isActive: true,
          spocEmail: `${name.toLowerCase().replace(' ', '.')}@hotel.com`,
          spocWhatsapp: '+1234567890'
        });
      });
    }

    // Create default SLA configs if none exist
    if (this.collections.slaConfigs.length === 0) {
      this.create('slaConfigs', {
        department: 'default',
        responseTimeHours: 2,
        resolutionTimeHours: 24,
        workingHours: {
          monday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          tuesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          wednesday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          thursday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          friday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          saturday: { isWorkingDay: true, startTime: '09:00', endTime: '18:00' },
          sunday: { isWorkingDay: false }
        },
        holidays: []
      });
    }
  }
}

export const db = new DatabaseService();
export default DatabaseService;