const handlePkgChange = async (pkgId: string) => {
    setSelectedPkgId(pkgId);
    setRows([]);
    setBookings([]);
    if (!pkgId || pkgId === "__none__") return;

    setLoadingBookings(true);
    try {
      // Busca as reservas filtradas pelo ID do pacote selecionado
      const filtered = await bookingsApi.all({ status: "pagamento_finalizado", package_id: pkgId });
      
      // Filtro de segurança para garantir apenas os confirmados/pagos
      const confirmedBookings = filtered.filter(b => b.status === "pagamento_finalizado");
      setBookings(confirmedBookings);

      let seatCounter = 1;
      const expanded: PassengerRow[] = [];

      // Percorre cada reserva encontrada para o Pacote X
      for (const b of confirmedBookings) {
        // Extrai o titular e TODOS os acompanhantes daquela mesma reserva
        const pessoas = allPassengers(b);
        
        // Insere cada pessoa como uma linha individual na listagem de assentos
        for (const p of pessoas) {
          expanded.push({
            passageiro: p.full_name,
            rg: p.rg || "",
            funcao: p.role,
            voucher: b.voucher_code || "",
            assentoNum: String(seatCounter++), // Sugere um número sequencial, mas editável
            confirmado: false,
          });
        }
      }
      setRows(expanded);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar reservas");
    } finally {
      setLoadingBookings(false);
    }
  };
