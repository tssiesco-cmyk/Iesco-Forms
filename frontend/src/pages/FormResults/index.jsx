import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  FiArrowLeft, FiEdit3, FiEye, FiUsers, FiCheckCircle,
  FiMessageSquare, FiClock, FiTrendingUp, FiPercent
} from "react-icons/fi";
import { useForms } from "../../context/FormContext";
import Button from "../../components/atoms/Button";
import Avatar from "../../components/atoms/Avatar";

/* ===== LAYOUT ===== */
const Page = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const SidePanel = styled.aside`
  width: 280px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
`;

const SideHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-shrink: 0;
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const SideTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SideNav = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavBtn = styled.button`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : "transparent"};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.medium : theme.fontWeights.normal};
  text-align: left;
  &:hover { background: ${({ $active, theme }) => $active ? theme.colors.primaryLight : theme.colors.surfaceAlt}; }
`;

const SideStats = styled.div`
  padding: 16px 20px;
  margin-top: auto;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SideStatRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SideStatIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SideStatInfo = styled.div`
  span { display: block; font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { display: block; font-size: ${({ theme }) => theme.fontSizes.base}; font-weight: ${({ theme }) => theme.fontWeights.semibold}; }
`;

/* ===== MAIN ===== */
const Main = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  max-width: 960px;
`;

/* ===== TABS ===== */
const Tabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 28px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button`
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ $active, theme }) => $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  color: ${({ $active, theme }) => $active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.primary : "transparent"};
  margin-bottom: -1px;
  transition: all 0.15s;

  &:hover { color: ${({ theme }) => theme.colors.text}; }
`;

/* ===== KPI CARDS ===== */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
`;

const KpiCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 20px;
`;

const KpiIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
`;

const KpiValue = styled.div`
  font-size: 26px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 2px;
`;

const KpiLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ===== QUESTION BLOCKS ===== */
const QuestionBlock = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 24px;
  margin-bottom: 20px;
`;

const QHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const QTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QNum = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const QType = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: 3px 8px;
  border-radius: 4px;
`;

const QResponseCount = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 16px;
  display: block;
`;

/* ===== DONUT CHART ===== */
const ChartRow = styled.div`
  display: flex;
  gap: 32px;
  align-items: center;
`;

const DonutWrapper = styled.div`
  width: 160px;
  height: 160px;
  flex-shrink: 0;
`;

const DonutSvg = styled.svg`
  width: 160px;
  height: 160px;
  transform: rotate(-90deg);
`;

const DonutCenter = styled.div`
  position: relative;
  width: 160px;
  height: 160px;
`;

const DonutLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;

  strong {
    display: block;
    font-size: 22px;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const LegendList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LegendDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`;

const LegendLabel = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
`;

const LegendValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};
  min-width: 30px;
  text-align: right;
`;

const LegendPercent = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 36px;
  text-align: right;
`;

/* ===== BAR CHART ===== */
const BarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BarLabel = styled.span`
  width: 160px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 28px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.sm};
  transition: width 0.6s ease;
  background: ${({ $color }) => $color};
`;

const BarValue = styled.span`
  width: 30px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const BarPercent = styled.span`
  width: 40px;
  text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/* ===== TEXT RESPONSES ===== */
const TextList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const TextItem = styled.div`
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: 1.5;
`;

const TextTime = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`;

/* ===== RESPONSES TABLE ===== */
const Table = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 1fr 180px 120px;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`;

const TableHeaderCell = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 1fr 180px 120px;
  padding: 14px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  align-items: center;
  transition: background 0.1s;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.surfaceAlt}; }
`;

const RespondentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const CellText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmptyMsg = styled.p`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-style: italic;
  text-align: center;
  padding: 40px;
`;

/* ===== HELPERS ===== */
const chartColors = ["#6542F4", "#2DB87F", "#F5A623", "#E34850", "#3B82F6", "#8B5CF6", "#0891B2", "#D97706", "#059669", "#7C3AED"];

const typeLabels = {
  short_text: "Texto corto",
  long_text: "Texto largo",
  single_choice: "Opcion unica",
  multiple_choice: "Opcion multiple",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function DonutChart({ stats, total }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <DonutCenter>
      <DonutSvg viewBox="0 0 160 160">
        {stats.map((s) => {
          const dash = (s.count / (total || 1)) * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle
              key={s.label}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth="20"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
            />
          );
        })}
      </DonutSvg>
      <DonutLabel>
        <strong>{total}</strong>
        <span>respuestas</span>
      </DonutLabel>
    </DonutCenter>
  );
}

function FormResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getForm, getFormResponses } = useForms();
  const [activeTab, setActiveTab] = useState("resumen");

  const form = getForm(id);
  const formResponses = getFormResponses(id);

  if (!form) {
    return (
      <Page><Main><EmptyMsg>Formulario no encontrado</EmptyMsg>
        <Button onClick={() => navigate("/formularios")}>Volver</Button>
      </Main></Page>
    );
  }

  const totalResponses = formResponses.length;
  const questionsCount = form.questions.length;
  const answeredCount = formResponses.filter((r) =>
    Object.values(r.answers).some((a) => a && (Array.isArray(a) ? a.length > 0 : a.toString().trim() !== ""))
  ).length;
  const completionRate = totalResponses > 0 ? Math.round((answeredCount / totalResponses) * 100) : 0;

  const getChoiceStats = (question) => {
    const counts = {};
    question.options.forEach((opt) => { counts[opt.id] = 0; });
    formResponses.forEach((r) => {
      const answer = r.answers[question.id];
      if (!answer) return;
      if (Array.isArray(answer)) {
        answer.forEach((optId) => { if (counts[optId] !== undefined) counts[optId]++; });
      } else {
        if (counts[answer] !== undefined) counts[answer]++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return question.options.map((opt, i) => ({
      label: opt.text,
      count: counts[opt.id],
      percent: Math.round((counts[opt.id] / total) * 100),
      color: chartColors[i % chartColors.length],
    }));
  };

  const getTextResponses = (questionId) =>
    formResponses
      .filter((r) => r.answers[questionId] && r.answers[questionId].toString().trim() !== "")
      .map((r) => ({ text: r.answers[questionId], date: r.submittedAt }));

  const getRespondentName = (response) => {
    const r = response.respondent || {};
    if (r.name) return r.name;
    const nameField = form.introFields?.find((f) => f.type === "name");
    if (nameField && r[nameField.id]) return r[nameField.id];
    const vals = Object.values(r);
    return vals[0] || "Anonimo";
  };

  const getRespondentEmail = (response) => {
    const r = response.respondent || {};
    if (r.email) return r.email;
    const emailField = form.introFields?.find((f) => f.type === "email");
    if (emailField && r[emailField.id]) return r[emailField.id];
    return "";
  };

  const getRespondentAnswerCount = (response) => {
    return Object.values(response.answers).filter((a) =>
      a && (Array.isArray(a) ? a.length > 0 : a.toString().trim() !== "")
    ).length;
  };

  return (
    <Page>
      <SidePanel>
        <SideHeader>
          <BackBtn onClick={() => navigate(`/formularios/${id}/editar`)}>
            <FiArrowLeft size={18} />
          </BackBtn>
          <SideTitle>{form.title}</SideTitle>
        </SideHeader>

        <SideNav>
          <NavBtn $active onClick={() => navigate(`/formularios/${id}/resultados`)}>
            <FiMessageSquare size={16} /> Resultados
          </NavBtn>
          <NavBtn onClick={() => navigate(`/formularios/${id}/editar`)}>
            <FiEdit3 size={16} /> Editor
          </NavBtn>
          <NavBtn onClick={() => navigate(`/formularios/${id}/vista`)}>
            <FiEye size={16} /> Vista previa
          </NavBtn>
        </SideNav>

        <SideStats>
          <SideStatRow>
            <SideStatIcon $bg="#F0ECFE" $color="#6542F4"><FiUsers size={14} /></SideStatIcon>
            <SideStatInfo><span>Respuestas</span><strong>{totalResponses}</strong></SideStatInfo>
          </SideStatRow>
          <SideStatRow>
            <SideStatIcon $bg="#EAFAF3" $color="#2DB87F"><FiCheckCircle size={14} /></SideStatIcon>
            <SideStatInfo><span>Completado</span><strong>{completionRate}%</strong></SideStatInfo>
          </SideStatRow>
          <SideStatRow>
            <SideStatIcon $bg="#FFF8EC" $color="#F5A623"><FiClock size={14} /></SideStatIcon>
            <SideStatInfo>
              <span>Ultima respuesta</span>
              <strong>{totalResponses > 0 ? formatShortDate(formResponses[0].submittedAt) : "-"}</strong>
            </SideStatInfo>
          </SideStatRow>
        </SideStats>
      </SidePanel>

      <Main>
        <Tabs>
          <Tab $active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")}>Resumen</Tab>
          <Tab $active={activeTab === "respuestas"} onClick={() => setActiveTab("respuestas")}>Respuestas ({totalResponses})</Tab>
        </Tabs>

        {activeTab === "resumen" && (
          <>
            <KpiGrid>
              <KpiCard>
                <KpiIcon $bg="#F0ECFE" $color="#6542F4"><FiUsers size={16} /></KpiIcon>
                <KpiValue>{totalResponses}</KpiValue>
                <KpiLabel>Total respuestas</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $bg="#EAFAF3" $color="#2DB87F"><FiPercent size={16} /></KpiIcon>
                <KpiValue>{completionRate}%</KpiValue>
                <KpiLabel>Tasa de completado</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $bg="#FFF8EC" $color="#F5A623"><FiTrendingUp size={16} /></KpiIcon>
                <KpiValue>{questionsCount}</KpiValue>
                <KpiLabel>Preguntas</KpiLabel>
              </KpiCard>
              <KpiCard>
                <KpiIcon $bg="#FEF0F0" $color="#E34850"><FiClock size={16} /></KpiIcon>
                <KpiValue>{totalResponses > 0 ? formatShortDate(formResponses[0].submittedAt) : "-"}</KpiValue>
                <KpiLabel>Ultima respuesta</KpiLabel>
              </KpiCard>
            </KpiGrid>

            {form.questions.map((q, i) => {
              const isChoice = q.type === "single_choice" || q.type === "multiple_choice";
              const stats = isChoice ? getChoiceStats(q) : [];
              const totalForQ = stats.reduce((a, b) => a + b.count, 0);
              const textResps = !isChoice ? getTextResponses(q.id) : [];

              return (
                <QuestionBlock key={q.id}>
                  <QHeader>
                    <QTitle><QNum>{i + 1}</QNum>{q.title || "Pregunta sin titulo"}</QTitle>
                    <QType>{typeLabels[q.type]}</QType>
                  </QHeader>
                  <QResponseCount>
                    {isChoice
                      ? `${formResponses.filter((r) => r.answers[q.id]).length} respuestas`
                      : `${textResps.length} respuestas`}
                  </QResponseCount>

                  {q.type === "single_choice" && (
                    <ChartRow>
                      <DonutWrapper>
                        <DonutChart stats={stats} total={totalForQ} />
                      </DonutWrapper>
                      <LegendList>
                        {stats.map((s) => (
                          <LegendItem key={s.label}>
                            <LegendDot $color={s.color} />
                            <LegendLabel>{s.label}</LegendLabel>
                            <LegendValue>{s.count}</LegendValue>
                            <LegendPercent>{s.percent}%</LegendPercent>
                          </LegendItem>
                        ))}
                      </LegendList>
                    </ChartRow>
                  )}

                  {q.type === "multiple_choice" && (
                    <BarList>
                      {stats.map((s) => (
                        <BarRow key={s.label}>
                          <BarLabel>{s.label}</BarLabel>
                          <BarTrack>
                            <BarFill $color={s.color} style={{ width: `${s.percent}%` }} />
                          </BarTrack>
                          <BarValue>{s.count}</BarValue>
                          <BarPercent>{s.percent}%</BarPercent>
                        </BarRow>
                      ))}
                    </BarList>
                  )}

                  {(q.type === "short_text" || q.type === "long_text") && (
                    textResps.length > 0 ? (
                      <TextList>
                        {textResps.map((r, j) => (
                          <TextItem key={j}>
                            {r.text}
                            <TextTime>{formatDate(r.date)}</TextTime>
                          </TextItem>
                        ))}
                      </TextList>
                    ) : (
                      <EmptyMsg>Sin respuestas</EmptyMsg>
                    )
                  )}
                </QuestionBlock>
              );
            })}
          </>
        )}

        {activeTab === "respuestas" && (
          totalResponses > 0 ? (
            <Table>
              <TableHeader>
                <TableHeaderCell>#</TableHeaderCell>
                <TableHeaderCell>Nombre</TableHeaderCell>
                <TableHeaderCell>Correo</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Respuestas</TableHeaderCell>
              </TableHeader>
              {formResponses.map((r, i) => {
                const name = getRespondentName(r);
                const email = getRespondentEmail(r);
                const initial = name.charAt(0).toUpperCase();
                const answeredQ = getRespondentAnswerCount(r);
                const avatarColors = ["#6542F4", "#2DB87F", "#F5A623", "#E34850", "#3B82F6", "#8B5CF6"];

                return (
                  <TableRow key={r.id}>
                    <CellText>{i + 1}</CellText>
                    <RespondentInfo>
                      <Avatar $size={30} $bg={avatarColors[i % avatarColors.length]}>{initial}</Avatar>
                      <strong>{name}</strong>
                    </RespondentInfo>
                    <CellText>{email}</CellText>
                    <CellText>{formatDate(r.submittedAt)}</CellText>
                    <CellText>{answeredQ} de {questionsCount}</CellText>
                  </TableRow>
                );
              })}
            </Table>
          ) : (
            <EmptyMsg>Aun no hay respuestas para este formulario.</EmptyMsg>
          )
        )}
      </Main>
    </Page>
  );
}

export default FormResults;
