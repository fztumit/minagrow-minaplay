import path from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

export type FollowUpTask = {
  id: string;
  leadId: string;
  dueDate: string;
  title: string;
  createdAt: string;
};

export type DBData = {
  tasks: FollowUpTask[];
};

const defaultData: DBData = {
  tasks: []
};

const dbFilePath = path.resolve(process.cwd(), '.db.json');
const adapter = new JSONFile<DBData>(dbFilePath);
const db = new Low<DBData>(adapter, defaultData);

export async function getDb(): Promise<Low<DBData>> {
  await db.read();
  db.data ||= { ...defaultData };
  return db;
}

export async function addFollowUpTasks(leadId: string): Promise<FollowUpTask[]> {
  const offsets = [3, 10, 30, 180];
  const now = new Date();
  const database = await getDb();

  const tasks = offsets.map((dayOffset) => {
    const due = new Date(now);
    due.setDate(due.getDate() + dayOffset);

    return {
      id: `${leadId}-${dayOffset}`,
      leadId,
      dueDate: due.toISOString().slice(0, 10),
      title: `Takip: +${dayOffset} gün`,
      createdAt: now.toISOString()
    };
  });

  const existingIds = new Set(database.data.tasks.map((task) => task.id));
  const newTasks = tasks.filter((task) => !existingIds.has(task.id));

  database.data.tasks.push(...newTasks);
  await database.write();

  return newTasks;
}
