SELECT R034FUN.NUMEMP, R034FUN.TIPCOL, R034FUN.NUMCAD, R038AFA.DATAFA FROM R038AFA, R034FUN
where R034FUN.NUMEMP = 1 
OR (R034FUN.TIPCOL = 1
AND R034FUN.TIPCOL = 3)
AND R034FUN.NUMCAD IN (1,2,3,4)
AND R034FUN.NOMFUN LIKE '%TIAGO%'
AND R038AFA.NUMEMP = R034FUN.NUMEMP
AND R038AFA.TIPCOL = R034FUN.TIPCOL
AND R038AFA.NUMCAD = R034FUN.NUMCAD
AND R038AFA.DATAFA = (SELECT MAX(DATAFA) 
                FROM R038AFA T2 
               WHERE T2.NUMEMP = R038AFA.NUMAFA
                 AND T2.TIPCOL = R038AFA.TIPCOL
                 AND T2.NUMCAD = R038AFA.NUMCAD)
AND R038AFA.SITAFA = 7
ORDER BY R034FUN.NUMEMP, R034FUN.TIPCOL, R034FUN.NUMCAD, R038AFA.DATAFA
                 