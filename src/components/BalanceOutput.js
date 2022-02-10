import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as utils from '../utils';

class BalanceOutput extends Component {
  render() {
    if (!this.props.userInput.format) {
      return null;
    }

    return (
      <div className='output'>
        <p>
          Total Debit: {this.props.totalDebit} Total Credit: {this.props.totalCredit}
          <br />
          Balance from account {this.props.userInput.startAccount || '*'}
          {' '}
          to {this.props.userInput.endAccount || '*'}
          {' '}
          from period {utils.dateToString(this.props.userInput.startPeriod)}
          {' '}
          to {utils.dateToString(this.props.userInput.endPeriod)}
        </p>
        {this.props.userInput.format === 'CSV' ? (
          <pre>{utils.toCSV(this.props.balance)}</pre>
        ) : null}
        {this.props.userInput.format === 'HTML' ? (
          <table className="table">
            <thead>
              <tr>
                <th>ACCOUNT</th>
                <th>DESCRIPTION</th>
                <th>DEBIT</th>
                <th>CREDIT</th>
                <th>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {this.props.balance.map((entry, i) => (
                <tr key={i}>
                  <th scope="row">{entry.ACCOUNT}</th>
                  <td>{entry.DESCRIPTION}</td>
                  <td>{entry.DEBIT}</td>
                  <td>{entry.CREDIT}</td>
                  <td>{entry.BALANCE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    );
  }
}

BalanceOutput.propTypes = {
  balance: PropTypes.arrayOf(
    PropTypes.shape({
      ACCOUNT: PropTypes.number.isRequired,
      DESCRIPTION: PropTypes.string.isRequired,
      DEBIT: PropTypes.number.isRequired,
      CREDIT: PropTypes.number.isRequired,
      BALANCE: PropTypes.number.isRequired
    })
  ).isRequired,
  totalCredit: PropTypes.number.isRequired,
  totalDebit: PropTypes.number.isRequired,
  userInput: PropTypes.shape({
    startAccount: PropTypes.number,
    endAccount: PropTypes.number,
    startPeriod: PropTypes.date,
    endPeriod: PropTypes.date,
    format: PropTypes.string
  }).isRequired
};

export default connect(state => {
  let balance = [];

  const accounts = state.accounts
  const journalEntries = state.journalEntries
  const userInput = state.userInput

  accounts.map((account) => {
    if ((isNaN(userInput.startAccount) || account.ACCOUNT >= userInput.startAccount) && (isNaN(userInput.endAccount) || account.ACCOUNT <= userInput.endAccount)) {
      const filterJournalEntries = journalEntries.filter(entry => entry.ACCOUNT === account.ACCOUNT &&
        (!utils.isValidDate(userInput.startPeriod) || entry.PERIOD.getTime() >= userInput.startPeriod.getTime()) &&
        (!utils.isValidDate(userInput.endPeriod) || entry.PERIOD.getTime() <= userInput.endPeriod.getTime()))
      if (filterJournalEntries && filterJournalEntries.length > 0) {
        const totalCredit = filterJournalEntries.reduce((acc, entry) => acc + entry.CREDIT, 0);
        const totalDebit = filterJournalEntries.reduce((acc, entry) => acc + entry.DEBIT, 0);
        balance.push({
          ACCOUNT: account.ACCOUNT,
          DESCRIPTION: account.LABEL,
          DEBIT: totalDebit,
          CREDIT: totalCredit,
          BALANCE: totalDebit - totalCredit
        })
      }
    }
  })

  const totalCredit = balance.reduce((acc, entry) => acc + entry.CREDIT, 0);
  const totalDebit = balance.reduce((acc, entry) => acc + entry.DEBIT, 0);

  return {
    balance,
    totalCredit,
    totalDebit,
    userInput: state.userInput
  };
})(BalanceOutput);
