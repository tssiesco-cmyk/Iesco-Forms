import { useState } from "react";
import styled from "styled-components";
import { FiEdit3 } from "react-icons/fi";
import PageHeader from "../../components/molecules/PageHeader";
import SearchToolbar from "../../components/molecules/SearchToolbar";
import FormCard from "../../components/molecules/FormCard";

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const sharedForms = [
  { name: "Encuesta de equipo", sharedBy: "Carlos", date: "Compartido hoy", responses: 12 },
  { name: "Registro de visitantes", sharedBy: "Maria", date: "Compartido ayer", responses: 34 },
];

function Shared() {
  const [search, setSearch] = useState("");

  const filtered = sharedForms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Compartidos" subtitle="Formularios que otros han compartido contigo." />

      <SearchToolbar
        placeholder="Buscar formularios compartidos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        showFilter={false}
      />

      <CardGrid>
        {filtered.map((f) => (
          <FormCard
            key={f.name}
            icon={<FiEdit3 size={24} />}
            title={f.name}
            date={`${f.date} por ${f.sharedBy}`}
            responses={f.responses}
          />
        ))}
      </CardGrid>
    </div>
  );
}

export default Shared;
