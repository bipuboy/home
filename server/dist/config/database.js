"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
class DatabaseService {
    constructor() {
        this.dataPath = path_1.default.join(__dirname, '../../data');
        this.ensureDataDirectory();
        this.collections = this.loadCollections();
    }
    ensureDataDirectory() {
        if (!fs_1.default.existsSync(this.dataPath)) {
            fs_1.default.mkdirSync(this.dataPath, { recursive: true });
        }
    }
    loadCollections() {
        const collections = {
            tickets: [],
            users: [],
            automationRules: [],
            slaConfigs: [],
            departments: [],
            escalationRules: []
        };
        for (const [collectionName] of Object.entries(collections)) {
            const filePath = path_1.default.join(this.dataPath, `${collectionName}.json`);
            if (fs_1.default.existsSync(filePath)) {
                try {
                    const data = fs_1.default.readFileSync(filePath, 'utf8');
                    collections[collectionName] = JSON.parse(data);
                }
                catch (error) {
                    console.error(`Error loading ${collectionName}:`, error);
                }
            }
        }
        return collections;
    }
    saveCollection(collectionName) {
        const filePath = path_1.default.join(this.dataPath, `${collectionName}.json`);
        try {
            fs_1.default.writeFileSync(filePath, JSON.stringify(this.collections[collectionName], null, 2));
        }
        catch (error) {
            console.error(`Error saving ${collectionName}:`, error);
        }
    }
    // Generic CRUD operations
    create(collectionName, data) {
        const newItem = {
            id: (0, uuid_1.v4)(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.collections[collectionName].push(newItem);
        this.saveCollection(collectionName);
        return newItem;
    }
    findAll(collectionName) {
        return this.collections[collectionName];
    }
    findById(collectionName, id) {
        const item = this.collections[collectionName].find(item => item.id === id);
        return item || null;
    }
    findBy(collectionName, predicate) {
        return this.collections[collectionName].filter(predicate);
    }
    update(collectionName, id, updates) {
        const index = this.collections[collectionName].findIndex(item => item.id === id);
        if (index === -1)
            return null;
        this.collections[collectionName][index] = {
            ...this.collections[collectionName][index],
            ...updates,
            updatedAt: new Date()
        };
        this.saveCollection(collectionName);
        return this.collections[collectionName][index];
    }
    delete(collectionName, id) {
        const index = this.collections[collectionName].findIndex(item => item.id === id);
        if (index === -1)
            return false;
        this.collections[collectionName].splice(index, 1);
        this.saveCollection(collectionName);
        return true;
    }
    // Pagination and filtering
    findWithPagination(collectionName, options) {
        let data = this.collections[collectionName];
        // Apply filter if provided
        if (options.filter) {
            data = data.filter(options.filter);
        }
        // Apply sorting
        if (options.sortBy) {
            data.sort((a, b) => {
                const aVal = a[options.sortBy];
                const bVal = b[options.sortBy];
                if (options.sortOrder === 'desc') {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
                else {
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
    initializeDefaultData() {
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
exports.db = new DatabaseService();
exports.default = DatabaseService;
//# sourceMappingURL=database.js.map