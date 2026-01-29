export type Employee = {
  id: string
  fullName: string
  divisionId?: string
  email?: string
  externalRef?: string
}

export type Division = {
  id: string
  name: string
  externalRef?: string
}

export type TimeOffType = 'VACATION' | 'SICK' | 'UNPAID' | 'OTHER'

export type TimeOffEvent = {
  id: string
  employeeId: string
  divisionId?: string
  type: TimeOffType
  startDate: string
  endDate: string
  sourceSystem?: 'VIEWPOINT' | 'INTERNAL'
  raw?: unknown
}
