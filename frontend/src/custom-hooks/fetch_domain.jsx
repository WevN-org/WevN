const fetchDomain = useCallback(
        async () => {
            try {
                const result = await ApiService.getDomain();
                setState(
                    (prev) => ({
                        ...prev,
                        domains: result
                    })
                )
            }
            catch (err) {
                console.log(err)
            }
        }, []);