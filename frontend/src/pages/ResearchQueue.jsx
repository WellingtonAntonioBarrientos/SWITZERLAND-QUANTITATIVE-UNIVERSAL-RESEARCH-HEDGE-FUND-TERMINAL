import { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Trash2, Plus, Send } from "lucide-react";
import { API, logError } from '../lib/config';
import { LoadingState } from '../components/Shared';

const ResearchQueue = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', tags: [] });
  const [analyzing, setAnalyzing] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/research/tasks`);
      setTasks(res.data);
    } catch (e) {
      logError("Error fetching tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60000); // Auto-refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const createTask = async () => {
    try {
      await axios.post(`${API}/research/tasks`, newTask);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', tags: [] });
      setShowCreate(false);
      fetchTasks();
    } catch (e) {
      logError("Error creating task:", e);
    }
  };

  const analyzeTask = async (taskId) => {
    setAnalyzing(taskId);
    try {
      await axios.post(`${API}/research/tasks/${taskId}/analyze`);
      fetchTasks();
    } catch (e) {
      logError("Error analyzing task:", e);
    } finally {
      setAnalyzing(null);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`${API}/research/tasks/${taskId}`);
      fetchTasks();
    } catch (e) {
      logError("Error deleting task:", e);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div data-testid="research-queue">
      <div className="page-header">
        <div>
          <h1 className="page-title">Research Queue</h1>
          <p className="page-subtitle">AI-powered research analysis</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-quant px-3 py-2 flex items-center gap-2" data-testid="create-task-btn">
          <Plus size={14} strokeWidth={1.5} />
          <span>New Task</span>
        </button>
      </div>

      {showCreate && (
        <div className="quant-card mb-6" data-testid="create-task-form">
          <div className="quant-card-header">Create Research Task</div>
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm"
              data-testid="task-title-input"
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="w-full px-3 py-2 rounded-sm text-sm min-h-[100px]"
              data-testid="task-description-input"
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-3 py-2 rounded-sm text-sm"
              data-testid="task-priority-select"
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <div className="flex gap-2">
              <button onClick={createTask} className="btn-quant btn-quant-approve px-4 py-2" data-testid="submit-task-btn">Create</button>
              <button onClick={() => setShowCreate(false)} className="btn-quant px-4 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="quant-card p-8 text-center text-[#71717a]">
            No research tasks. Create one to get started.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="quant-card" data-testid={`task-${task.id}`}>
              <div className="quant-card-header flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded badge-${task.status.toLowerCase()}`}>
                    {task.status}
                  </span>
                  <span className="text-xs text-[#71717a]">{task.priority}</span>
                </div>
                <div className="flex gap-2">
                  {task.status === 'PENDING' && (
                    <button
                      onClick={() => analyzeTask(task.id)}
                      disabled={analyzing === task.id}
                      className="btn-quant px-3 py-1 text-xs flex items-center gap-1"
                      data-testid={`analyze-btn-${task.id}`}
                    >
                      {analyzing === task.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                      Analyze
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="btn-quant btn-quant-reject px-2 py-1" data-testid={`delete-btn-${task.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-[#ededed] mb-2">{task.title}</h3>
                <p className="text-sm text-[#a1a1aa] mb-3">{task.description}</p>
                {task.ai_analysis && (
                  <div className="bg-[#000] border border-[#27272a] rounded-sm p-3 mt-3">
                    <div className="text-xs text-[#71717a] mb-2 uppercase">AI Analysis</div>
                    <p className="text-sm text-[#ededed] whitespace-pre-wrap">{task.ai_analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResearchQueue;
