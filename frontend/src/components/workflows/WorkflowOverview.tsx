import type { WorkflowStep, WorkflowView } from "../../app/workflow";

interface WorkflowOverviewProps {
  activeStep: WorkflowStep;
  steps: WorkflowStep[];
  workflowView: WorkflowView;
  onSelectWorkflow: (workflowView: WorkflowView) => void;
}

export function WorkflowOverview({ activeStep, steps, workflowView, onSelectWorkflow }: WorkflowOverviewProps) {
  return (
    <section className="workflow-overview" aria-label="Basvuru akis adimlari">
      <div>
        <span className="eyebrow">Aktif akis</span>
        <h2>{activeStep.title}</h2>
        <p>{activeStep.description}</p>
      </div>
      <nav className="workflow-steps" aria-label="Basvuru akis adimlari">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`workflow-step${workflowView === step.id ? " workflow-step--active" : ""}${step.done ? " workflow-step--done" : ""}`}
            disabled={!step.enabled}
            onClick={() => onSelectWorkflow(step.id)}
            aria-current={workflowView === step.id ? "step" : undefined}
          >
            <span>{step.number}</span>
            <strong>{step.title}</strong>
            <small>{step.done ? "Tamamlandi" : step.enabled ? "Devam" : "Kilitli"}</small>
          </button>
        ))}
      </nav>
    </section>
  );
}
