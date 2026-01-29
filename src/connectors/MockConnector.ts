import { Division, Employee, TimeOffEvent, TimeOffType } from "../types";
import { TimeOffDataSource } from "./TimeOffDataSource";

export interface MockConnectorConfig {
  employeeCount?: number;
  divisionCount?: number;
  eventCount?: number;
  seed?: number;
}

export class MockConnector implements TimeOffDataSource {
  private employees: Employee[] = [];
  private divisions: Division[] = [];
  private events: TimeOffEvent[] = [];

  constructor(private config: MockConnectorConfig = {}) {
    this.generateMockData();
  }

  private generateMockData() {
    const divisionCount = this.config.divisionCount ?? 5;
    const employeeCount = this.config.employeeCount ?? 25;
    const eventCount = this.config.eventCount ?? 50;

    // Generate divisions
    const divisionNames = [
      "Engineering",
      "Operations",
      "Sales & Marketing",
      "Human Resources",
      "Finance",
      "IT Services",
      "Legal",
      "Customer Success",
      "Product Management",
      "Quality Assurance",
    ];

    for (let i = 0; i < divisionCount; i++) {
      this.divisions.push({
        id: `div-${i + 1}`,
        name: divisionNames[i % divisionNames.length],
        externalRef: `MOCK-DIV-${i + 1}`,
      });
    }

    // Generate employees
    const firstNames = [
      "Emma",
      "Liam",
      "Olivia",
      "Noah",
      "Ava",
      "Ethan",
      "Sophia",
      "Mason",
      "Isabella",
      "William",
      "Mia",
      "James",
      "Charlotte",
      "Benjamin",
      "Amelia",
      "Lucas",
      "Harper",
      "Henry",
      "Evelyn",
      "Alexander",
      "Abigail",
      "Michael",
      "Emily",
      "Daniel",
      "Elizabeth",
      "Matthew",
      "Sofia",
      "Jackson",
      "Avery",
      "Sebastian",
    ];

    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Thompson",
      "White",
      "Harris",
      "Clark",
    ];

    for (let i = 0; i < employeeCount; i++) {
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      const divisionId = this.divisions[i % this.divisions.length].id;

      this.employees.push({
        id: `emp-${i + 1}`,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mockcompany.com`,
        divisionId,
        externalRef: `MOCK-EMP-${i + 1}`,
      });
    }

    // Generate time-off events
    const types: TimeOffType[] = ["VACATION", "SICK", "UNPAID", "OTHER"];
    const typeWeights = [0.65, 0.25, 0.05, 0.05]; // 65% vacation, 25% sick, etc.
    const currentYear = new Date().getFullYear();

    // Helper to get next Monday from a date
    const getNextMonday = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
      d.setDate(d.getDate() + daysUntilMonday);
      return d;
    };

    // Helper to add weekdays only
    const addWeekdays = (date: Date, days: number): Date => {
      const result = new Date(date);
      let added = 0;
      while (added < days) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
          added++;
        }
      }
      return result;
    };

    for (let i = 0; i < eventCount; i++) {
      const employee = this.employees[i % this.employees.length];
      
      // Weighted random type selection
      const rand = Math.random();
      let cumulativeWeight = 0;
      let type: TimeOffType = "VACATION";
      for (let j = 0; j < types.length; j++) {
        cumulativeWeight += typeWeights[j];
        if (rand <= cumulativeWeight) {
          type = types[j];
          break;
        }
      }

      let startDate: Date;
      let endDate: Date;

      if (type === "VACATION") {
        // Vacations typically start on Monday and are full weeks
        const randomMonth = Math.floor(Math.random() * 12);
        const randomDay = Math.floor(Math.random() * 28) + 1;
        const roughDate = new Date(currentYear, randomMonth, randomDay);
        
        // Start on a Monday
        startDate = getNextMonday(roughDate);
        
        // Vacation durations: mostly 1 week (5 days), sometimes 2 weeks (10 days), rarely 3 weeks (15 days)
        const durationRoll = Math.random();
        let workDays: number;
        if (durationRoll < 0.6) {
          workDays = 5; // 1 week - 60% of vacations
        } else if (durationRoll < 0.9) {
          workDays = 10; // 2 weeks - 30% of vacations
        } else {
          workDays = 15; // 3 weeks - 10% of vacations
        }
        
        // End date is start + workdays (excluding weekends)
        endDate = addWeekdays(startDate, workDays - 1); // -1 because start day counts
        
      } else {
        // Sick days and other types are usually shorter and can start any day
        const startMonth = Math.floor(Math.random() * 12);
        const startDay = Math.floor(Math.random() * 28) + 1;
        startDate = new Date(currentYear, startMonth, startDay);

        // Sick/unpaid/other: 1-3 days typically
        const duration = Math.floor(Math.random() * 3) + 1;
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);
      }

      this.events.push({
        id: `event-${i + 1}`,
        employeeId: employee.id,
        divisionId: employee.divisionId,
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        sourceSystem: "INTERNAL",
        raw: {
          generated: true,
          mockId: i + 1,
        },
      });
    }

    // Sort events by start date
    this.events.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  async getEmployees(): Promise<Employee[]> {
    // Simulate network delay
    await this.delay(100);
    return [...this.employees];
  }

  async getDivisions(): Promise<Division[]> {
    // Simulate network delay
    await this.delay(100);
    return [...this.divisions];
  }

  async getTimeOffEvents(params: {
    from?: Date;
    to?: Date;
  }): Promise<TimeOffEvent[]> {
    // Simulate network delay
    await this.delay(150);

    let filtered = [...this.events];

    if (params.from) {
      filtered = filtered.filter(
        (e) => new Date(e.endDate) >= params.from!
      );
    }

    if (params.to) {
      filtered = filtered.filter(
        (e) => new Date(e.startDate) <= params.to!
      );
    }

    return filtered;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
