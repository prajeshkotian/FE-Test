import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(false)
  const [isDataChange, setDataChange] = useState(false)

  const transactions = useMemo(
    () =>paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    
    transactionsByEmployeeUtils.invalidateData()
    //fix Bug 5
    if(!employees){
      setIsEmployeeLoading(true)
      await employeeUtils.fetchAll()
      setIsEmployeeLoading(false)
    }
    
    await paginatedTransactionsUtils.fetchAll()

    setIsLoading(false)
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  const updateMemoData=useCallback((transactionId: string, newValue: boolean):void=>{
    console.log(paginatedTransactions,transactionId,'transactionsss !!!')
    const transactionData = (paginatedTransactions?.data || []).find(item=>{
      console.log('transaction id', item)
      if(item.id === transactionId){
        return item
      }
    } )
    console.log(transactionData,'transaction !!!')
    if(transactionData){
      console.log(transactionData,'transaction found!!!')
      transactionData.approved = newValue
    }
    //paginatedTransactionsUtils.invalidateData()
    setDataChange(true)
    //paginatedTransactionsUtils.fetchAll()
  },[transactions, paginatedTransactions])

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      console.log('loading all transactions!!')
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isEmployeeLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }
            //fix bug 3 if newValue.id is null we loadAllTransactions as fallback
            newValue && newValue.id ? await loadTransactionsByEmployee(newValue.id) : await loadAllTransactions()
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} updateMemoData={updateMemoData}/>
          {/*fixed bug 6 */}
          {transactions !== null && paginatedTransactions && paginatedTransactions.nextPage && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
